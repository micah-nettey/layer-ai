import { Mistral } from '@mistralai/mistralai';
import { BaseProviderAdapter } from './base-adapter.js';
import {
  LayerRequest,
  LayerResponse,
  Role,
  FinishReason,
  ADAPTER_HANDLED,
} from '@layer-ai/sdk';
import { PROVIDER, type Provider } from '../../lib/provider-constants.js';
import { resolveApiKey } from '../../lib/key-resolver.js';

let client: Mistral | null = null;

function getMistralClient(apiKey?: string): Mistral {
  // If custom API key provided, create new client
  if (apiKey) {
    return new Mistral({ apiKey });
  }

  // Otherwise use singleton with platform key
  if (!client) {
    client = new Mistral({
      apiKey: process.env.MISTRAL_API_KEY || '',
    });
  }
  return client;
}

export class MistralAdapter extends BaseProviderAdapter {
  protected provider: Provider = PROVIDER.MISTRAL;

  protected roleMappings: Record<Role, string> = {
    system: ADAPTER_HANDLED,
    user: 'user',
    assistant: 'assistant',
    tool: 'tool',
    function: 'tool',
    model: 'assistant',
    developer: 'system',
  };

  // Map Mistral finish reasons to Layer finish reasons
  protected finishReasonMappings: Record<string, FinishReason> = {
    stop: 'completed',
    length: 'length_limit',
    tool_calls: 'tool_call',
    model_length: 'length_limit',
    error: 'error',
  };

  protected toolChoiceMappings: Record<string, string> = {
    auto: 'auto',
    none: 'none',
    required: 'any',
  };

  async call(request: LayerRequest, userId?: string): Promise<LayerResponse> {
    // Resolve API key (BYOK → Platform key)
    const resolved = await resolveApiKey(
      this.provider,
      userId,
      process.env.MISTRAL_API_KEY
    );

    switch (request.type) {
      case 'chat':
        return this.handleChat(request, resolved.key, resolved.usedPlatformKey);
      case 'embeddings':
        return this.handleEmbeddings(
          request,
          resolved.key,
          resolved.usedPlatformKey
        );
      case 'ocr':
        return this.handleOCR(request, resolved.key, resolved.usedPlatformKey);
      case 'image':
        throw new Error('Image generation not supported by Mistral');
      case 'tts':
        throw new Error('Text-to-speech not supported by Mistral');
      case 'video':
        throw new Error('Video generation not supported by Mistral');
      default:
        throw new Error(`Unknown modality: ${(request as any).type}`);
    }
  }

  private async handleChat(
    request: Extract<LayerRequest, { type: 'chat' }>,
    apiKey: string,
    usedPlatformKey: boolean
  ): Promise<LayerResponse> {
    const startTime = Date.now();
    const mistral = getMistralClient(apiKey);
    const { data: chat, model } = request;

    if (!model) {
      throw new Error('Model is required for chat completion');
    }

    // Build messages array
    const messages: Array<{
      role: 'system' | 'user' | 'assistant' | 'tool';
      content:
        | string
        | Array<{ type: string; text?: string; imageUrl?: string }>;
      toolCallId?: string;
      name?: string;
      toolCalls?: Array<{
        id: string;
        type: 'function';
        function: { name: string; arguments: string };
      }>;
    }> = [];

    // Handle system prompt
    if (chat.systemPrompt) {
      messages.push({ role: 'system', content: chat.systemPrompt });
    }

    // Convert messages to Mistral format
    for (const msg of chat.messages) {
      const role = this.mapRole(msg.role) as
        | 'system'
        | 'user'
        | 'assistant'
        | 'tool';

      // Handle vision messages (content + images)
      if (msg.images && msg.images.length > 0 && role === 'user') {
        const content: Array<{
          type: string;
          text?: string;
          imageUrl?: string;
        }> = [];

        if (msg.content) {
          content.push({ type: 'text', text: msg.content });
        }

        for (const image of msg.images) {
          const imageUrl =
            image.url ||
            `data:${image.mimeType || 'image/jpeg'};base64,${image.base64}`;
          content.push({
            type: 'image_url',
            imageUrl: imageUrl,
          });
        }

        messages.push({ role, content });
      }
      // Handle tool responses
      else if (msg.toolCallId && role === 'tool') {
        messages.push({
          role: 'tool',
          content: msg.content || '',
          toolCallId: msg.toolCallId,
          name: msg.name,
        });
      }
      // Handle assistant messages with tool calls
      else if (msg.toolCalls && msg.toolCalls.length > 0) {
        messages.push({
          role: 'assistant',
          content: msg.content || '',
          toolCalls: msg.toolCalls.map((tc) => ({
            id: tc.id,
            type: 'function' as const,
            function: {
              name: tc.function.name,
              arguments: tc.function.arguments,
            },
          })),
        });
      }
      // Handle regular text messages
      else {
        messages.push({
          role,
          content: msg.content || '',
        });
      }
    }

    // Convert tools to Mistral format - ensure parameters is always defined
    let tools:
      | Array<{
          type: 'function';
          function: {
            name: string;
            description?: string;
            parameters: Record<string, unknown>;
          };
        }>
      | undefined;

    if (chat.tools && chat.tools.length > 0) {
      tools = chat.tools.map((tool) => ({
        type: 'function' as const,
        function: {
          name: tool.function.name,
          description: tool.function.description,
          parameters:
            (tool.function.parameters as Record<string, unknown>) || {},
        },
      }));
    }

    // Map tool choice - Mistral uses 'auto', 'none', 'any', 'required' or specific function
    let toolChoice:
      | 'auto'
      | 'none'
      | 'any'
      | 'required'
      | { type: 'function'; function: { name: string } }
      | undefined;
    if (chat.toolChoice) {
      if (typeof chat.toolChoice === 'object') {
        toolChoice = chat.toolChoice as {
          type: 'function';
          function: { name: string };
        };
      } else {
        const mapped = this.mapToolChoice(chat.toolChoice);
        if (
          mapped === 'auto' ||
          mapped === 'none' ||
          mapped === 'any' ||
          mapped === 'required'
        ) {
          toolChoice = mapped;
        }
      }
    }

    const response = await mistral.chat.complete({
      model,
      messages: messages as any,
      ...(chat.temperature !== undefined && { temperature: chat.temperature }),
      ...(chat.maxTokens !== undefined && { maxTokens: chat.maxTokens }),
      ...(chat.topP !== undefined && { topP: chat.topP }),
      ...(chat.stopSequences !== undefined && { stop: chat.stopSequences }),
      ...(chat.frequencyPenalty !== undefined && {
        frequencyPenalty: chat.frequencyPenalty,
      }),
      ...(chat.presencePenalty !== undefined && {
        presencePenalty: chat.presencePenalty,
      }),
      ...(chat.seed !== undefined && { randomSeed: chat.seed }),
      ...(tools && { tools }),
      ...(toolChoice && { toolChoice }),
      ...(chat.responseFormat && {
        responseFormat:
          typeof chat.responseFormat === 'string'
            ? { type: chat.responseFormat }
            : chat.responseFormat,
      }),
    });

    const choice = response.choices?.[0];
    const message = choice?.message;

    // Extract tool calls if present - normalize arguments to string
    const toolCalls = message?.toolCalls?.map((tc) => ({
      id: tc.id || '',
      type: 'function' as const,
      function: {
        name: tc.function?.name || '',
        arguments:
          typeof tc.function?.arguments === 'string'
            ? tc.function.arguments
            : JSON.stringify(tc.function?.arguments || {}),
      },
    }));

    const promptTokens = response.usage?.promptTokens || 0;
    const completionTokens = response.usage?.completionTokens || 0;
    const totalTokens = response.usage?.totalTokens || 0;
    const cost = this.calculateCost(model, promptTokens, completionTokens);

    // Extract content as string - handle ContentChunk array
    let contentStr: string | undefined;
    if (message?.content) {
      if (typeof message.content === 'string') {
        contentStr = message.content;
      } else if (Array.isArray(message.content)) {
        // ContentChunk array - extract text parts
        contentStr = message.content
          .map((chunk: any) => chunk.text || chunk.content || '')
          .filter(Boolean)
          .join('');
      }
    }

    return {
      content: contentStr || undefined,
      toolCalls: toolCalls && toolCalls.length > 0 ? toolCalls : undefined,
      model: response.model || model,
      finishReason: this.mapFinishReason(choice?.finishReason || 'stop'),
      rawFinishReason: choice?.finishReason,
      usage: {
        promptTokens,
        completionTokens,
        totalTokens,
      },
      cost,
      latencyMs: Date.now() - startTime,
      usedPlatformKey,
      raw: response,
    };
  }

  private async handleEmbeddings(
    request: Extract<LayerRequest, { type: 'embeddings' }>,
    apiKey: string,
    usedPlatformKey: boolean
  ): Promise<LayerResponse> {
    const startTime = Date.now();
    const mistral = getMistralClient(apiKey);
    const { data: embedding, model } = request;

    if (!model) {
      throw new Error('Model is required for embeddings');
    }

    // Mistral expects 'inputs' as an array of strings
    const inputs = Array.isArray(embedding.input)
      ? embedding.input
      : [embedding.input];

    const response = await mistral.embeddings.create({
      model,
      inputs,
    });

    const embeddings = response.data?.map((d) => d.embedding || []) || [];

    const promptTokens = response.usage?.promptTokens || 0;
    const totalTokens = response.usage?.totalTokens || 0;
    const cost = this.calculateCost(model, promptTokens, 0);

    return {
      embeddings,
      model: response.model || model,
      usage: {
        promptTokens,
        completionTokens: 0,
        totalTokens,
      },
      cost,
      latencyMs: Date.now() - startTime,
      usedPlatformKey,
      raw: response,
    };
  }

  private async handleOCR(
    request: Extract<LayerRequest, { type: 'ocr' }>,
    apiKey: string,
    usedPlatformKey: boolean
  ): Promise<LayerResponse> {
    const startTime = Date.now();
    const mistral = getMistralClient(apiKey);
    const { data: ocr, model } = request;

    const ocrModel = model || 'mistral-ocr-latest';

    let document: { type: string; documentUrl?: string; imageUrl?: string };

    if (ocr.documentUrl) {
      document = {
        type: 'document_url',
        documentUrl: ocr.documentUrl,
      };
    } else if (ocr.imageUrl) {
      document = {
        type: 'image_url',
        imageUrl: ocr.imageUrl,
      };
    } else if (ocr.base64) {
      const mimeType = ocr.mimeType || 'application/pdf';
      const isImage = mimeType.startsWith('image/');

      if (isImage) {
        document = {
          type: 'image_url',
          imageUrl: `data:${mimeType};base64,${ocr.base64}`,
        };
      } else {
        document = {
          type: 'document_url',
          documentUrl: `data:${mimeType};base64,${ocr.base64}`,
        };
      }
    } else {
      throw new Error(
        'OCR requires either documentUrl, imageUrl, or base64 input'
      );
    }

    const response = await (mistral as any).ocr.process({
      model: ocrModel,
      document,
      ...(ocr.tableFormat && { tableFormat: ocr.tableFormat }),
      ...(ocr.includeImageBase64 !== undefined && {
        includeImageBase64: ocr.includeImageBase64,
      }),
      ...(ocr.extractHeader !== undefined && {
        extractHeader: ocr.extractHeader,
      }),
      ...(ocr.extractFooter !== undefined && {
        extractFooter: ocr.extractFooter,
      }),
    });

    const pages =
      response.pages?.map((page: any) => ({
        index: page.index,
        markdown: page.markdown,
        images: page.images,
        tables: page.tables,
        hyperlinks: page.hyperlinks,
        header: page.header,
        footer: page.footer,
        dimensions: page.dimensions,
      })) || [];

    const combinedMarkdown = pages
      .map((p: any) => p.markdown)
      .join('\n\n---\n\n');

    return {
      content: combinedMarkdown,
      ocr: {
        pages,
        model: response.model || ocrModel,
        documentAnnotation: response.documentAnnotation,
        usageInfo: response.usageInfo,
      },
      model: response.model || ocrModel,
      latencyMs: Date.now() - startTime,
      usedPlatformKey,
      raw: response,
    };
  }
}
