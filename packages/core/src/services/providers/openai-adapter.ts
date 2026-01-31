import OpenAI from 'openai';
import { BaseProviderAdapter } from './base-adapter.js';
import {
  LayerRequest,
  LayerResponse,
  Role,
  ImageDetail,
  ImageSize,
  ImageQuality,
  ImageStyle,
  VideoSize,
  AudioFormat,
  FinishReason,
} from '@layer-ai/sdk';
import { PROVIDER, type Provider } from '../../lib/provider-constants.js';
import { resolveApiKey } from '../../lib/key-resolver.js';

let openai: OpenAI | null = null;

function getOpenAIClient(apiKey?: string): OpenAI {
  // If custom API key provided, create new client
  if (apiKey) {
    return new OpenAI({ apiKey });
  }

  // Otherwise use singleton with platform key
  if (!openai) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openai;
}

export class OpenAIAdapter extends BaseProviderAdapter {
  protected provider: Provider = PROVIDER.OPENAI;

  protected roleMappings: Record<Role, string> = {
    system: 'system',
    user: 'user',
    assistant: 'assistant',
    tool: 'tool',
    function: 'function',
    model: 'assistant',
    developer: 'system',
  };

  protected imageDetailMappings: Record<ImageDetail, string> = {
    auto: 'auto',
    low: 'low',
    high: 'high',
  };

  protected finishReasonMappings: Record<string, FinishReason> = {
    stop: 'completed',
    length: 'length_limit',
    tool_calls: 'tool_call',
    content_filter: 'filtered',
  };

  protected imageSizeMappings: Record<ImageSize, string> = {
    '256x256': '256x256',
    '512x512': '512x512',
    '1024x1024': '1024x1024',
    '1792x1024': '1792x1024',
    '1024x1792': '1024x1792',
    '1536x1024': '1536x1024',
    '1024x1536': '1024x1536',
  };

  protected imageQualityMappings: Record<ImageQuality, string> = {
    standard: 'standard',
    hd: 'hd',
  };

  protected imageStyleMappings: Record<ImageStyle, string> = {
    vivid: 'vivid',
    natural: 'natural',
  };

  protected videoSizeMappings: Record<VideoSize, string> = {
    '720x1280': '720x1280',
    '1280x720': '1280x720',
    '1024x1792': '1024x1792',
    '1792x1024': '1792x1024',
  };

  protected audioFormatMappings: Record<AudioFormat, string> = {
    mp3: 'mp3',
    opus: 'opus',
    aac: 'aac',
    flac: 'flac',
    wav: 'wav',
    pcm: 'pcm',
  };

  async call(request: LayerRequest, userId?: string): Promise<LayerResponse> {
    // Resolve API key (BYOK → Platform key)
    const resolved = await resolveApiKey(
      this.provider,
      userId,
      process.env.OPENAI_API_KEY
    );

    switch (request.type) {
      case 'chat':
        return this.handleChat(request, resolved.key, resolved.usedPlatformKey);
      case 'image':
        return this.handleImageGeneration(
          request,
          resolved.key,
          resolved.usedPlatformKey
        );
      case 'embeddings':
        return this.handleEmbeddings(
          request,
          resolved.key,
          resolved.usedPlatformKey
        );
      case 'tts':
        return this.handleTextToSpeech(
          request,
          resolved.key,
          resolved.usedPlatformKey
        );
      case 'video':
        throw new Error('Video generation not yet supported by OpenAI');
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
    const client = getOpenAIClient(apiKey);
    const { data: chat, model } = request;

    if (!model) {
      throw new Error('Model is required for chat completion');
    }

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];

    if (chat.systemPrompt) {
      messages.push({ role: 'system', content: chat.systemPrompt });
    }

    for (const msg of chat.messages) {
      const role = this.mapRole(
        msg.role
      ) as OpenAI.Chat.ChatCompletionMessageParam['role'];

      // Handle vision messages (content + images)
      if (msg.images && msg.images.length > 0) {
        const content: OpenAI.Chat.ChatCompletionContentPart[] = [];

        if (msg.content) {
          content.push({ type: 'text', text: msg.content });
        }

        for (const image of msg.images) {
          const imageUrl =
            image.url ||
            `data:${image.mimeType || 'image/jpeg'};base64,${image.base64}`;
          content.push({
            type: 'image_url',
            image_url: {
              url: imageUrl,
              ...(image.detail && {
                detail: this.mapImageDetail(image.detail) as
                  | 'auto'
                  | 'low'
                  | 'high',
              }),
            },
          });
        }

        messages.push({ role: role as 'user', content });
      }
      // Handle tool responses (mutually exclusive)
      else if (msg.toolCallId) {
        messages.push({
          role: 'tool',
          content: msg.content || '',
          tool_call_id: msg.toolCallId,
        });
      }
      // Handle assistant messages with tool calls (can have content + tool_calls)
      else if (msg.toolCalls) {
        messages.push({
          role: 'assistant',
          content: msg.content || null,
          tool_calls:
            msg.toolCalls as unknown as OpenAI.Chat.ChatCompletionMessageToolCall[],
        });
      }
      // Handle regular text messages
      else {
        messages.push({
          role,
          content: msg.content || '',
          ...(role === 'function' && msg.name && { name: msg.name }),
        } as OpenAI.Chat.ChatCompletionMessageParam);
      }
    }

    const openaiRequest: OpenAI.Chat.ChatCompletionCreateParamsNonStreaming = {
      model: model,
      messages,
      stream: false,
      ...(chat.temperature !== undefined && { temperature: chat.temperature }),
      ...(chat.maxTokens !== undefined && {
        max_completion_tokens: chat.maxTokens,
      }),
      ...(chat.topP !== undefined && { top_p: chat.topP }),
      ...(chat.stopSequences !== undefined && { stop: chat.stopSequences }),
      ...(chat.frequencyPenalty !== undefined && {
        frequency_penalty: chat.frequencyPenalty,
      }),
      ...(chat.presencePenalty !== undefined && {
        presence_penalty: chat.presencePenalty,
      }),
      ...(chat.seed !== undefined && { seed: chat.seed }),
      ...(chat.tools && {
        tools: chat.tools as unknown as OpenAI.Chat.ChatCompletionTool[],
        ...(chat.toolChoice && {
          tool_choice:
            chat.toolChoice as OpenAI.Chat.ChatCompletionToolChoiceOption,
        }),
      }),
    };

    const response = await client.chat.completions.create(openaiRequest);
    const choice = response.choices[0];

    const promptTokens = response.usage?.prompt_tokens || 0;
    const completionTokens = response.usage?.completion_tokens || 0;
    const totalTokens = response.usage?.total_tokens || 0;
    const cost = this.calculateCost(model, promptTokens, completionTokens);

    return {
      content: choice.message.content || undefined,
      toolCalls: choice.message
        .tool_calls as unknown as LayerResponse['toolCalls'],
      model: response.model,
      finishReason: this.mapFinishReason(choice.finish_reason),
      rawFinishReason: choice.finish_reason,
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

  private async handleImageGeneration(
    request: Extract<LayerRequest, { type: 'image' }>,
    apiKey: string,
    usedPlatformKey: boolean
  ): Promise<LayerResponse> {
    const startTime = Date.now();
    const client = getOpenAIClient(apiKey);
    const { data: image, model } = request;

    if (!model) {
      throw new Error('Model is required for image generation');
    }

    const response = await client.images.generate({
      model: model,
      prompt: image.prompt,
      ...(image.size && {
        size: this.mapImageSize(image.size) as
          | '256x256'
          | '512x512'
          | '1024x1024'
          | '1792x1024'
          | '1024x1792',
      }),
      ...(image.quality && {
        quality: this.mapImageQuality(image.quality) as 'standard' | 'hd',
      }),
      ...(image.count && { n: image.count }),
      ...(image.style && {
        style: this.mapImageStyle(image.style) as 'vivid' | 'natural',
      }),
    });

    // Calculate cost based on quality, size, and count
    const cost = this.calculateImageCost(
      model,
      image.quality || 'standard',
      image.size || '1024x1024',
      image.count || 1
    );

    return {
      images: (response.data || []).map((img) => ({
        url: img.url,
        revisedPrompt: img.revised_prompt,
      })),
      model: model,
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
    const client = getOpenAIClient(apiKey);
    const { data: embedding, model } = request;

    if (!model) {
      throw new Error('Model is required for embeddings');
    }

    const response = await client.embeddings.create({
      model: model,
      input: embedding.input,
      ...(embedding.dimensions && { dimensions: embedding.dimensions }),
      ...(embedding.encodingFormat && {
        encoding_format: embedding.encodingFormat as 'float' | 'base64',
      }),
    });

    const promptTokens = response.usage?.prompt_tokens || 0;
    const cost = this.calculateCost(model, promptTokens, 0);

    return {
      embeddings: response.data.map((d) => d.embedding),
      model: response.model,
      usage: {
        promptTokens,
        completionTokens: 0,
        totalTokens: promptTokens,
      },
      cost,
      latencyMs: Date.now() - startTime,
      usedPlatformKey,
      raw: response,
    };
  }

  private async handleTextToSpeech(
    request: Extract<LayerRequest, { type: 'tts' }>,
    apiKey: string,
    usedPlatformKey: boolean
  ): Promise<LayerResponse> {
    const startTime = Date.now();
    const client = getOpenAIClient(apiKey);
    const { data: tts, model } = request;

    if (!model) {
      throw new Error('Model is required for tts');
    }

    const response = await client.audio.speech.create({
      model: model,
      input: tts.input,
      voice: (tts.voice || 'alloy') as
        | 'alloy'
        | 'echo'
        | 'fable'
        | 'onyx'
        | 'nova'
        | 'shimmer',
      ...(tts.speed !== undefined && { speed: tts.speed }),
      ...(tts.responseFormat && {
        response_format: this.mapAudioFormat(tts.responseFormat) as
          | 'mp3'
          | 'opus'
          | 'aac'
          | 'flac'
          | 'wav'
          | 'pcm',
      }),
    });

    const buffer = Buffer.from(await response.arrayBuffer());
    const base64 = buffer.toString('base64');

    return {
      audio: {
        base64,
        format: tts.responseFormat || 'mp3',
      },
      model: model,
      latencyMs: Date.now() - startTime,
      usedPlatformKey,
    };
  }
}
