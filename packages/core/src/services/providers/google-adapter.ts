import {
  GoogleGenAI,
  Content,
  Part,
  Tool as GoogleTool,
  FunctionCallingConfigMode,
  GenerateVideosOperation,
  VideoGenerationReferenceImage,
  VideoGenerationReferenceType,
} from '@google/genai';
import {
  LayerRequest,
  LayerResponse,
  Role,
  FinishReason,
  VideoSize,
} from '@layer-ai/sdk';
import { BaseProviderAdapter } from './base-adapter.js';
import { ADAPTER_HANDLED } from './base-adapter.js';
import { PROVIDER, type Provider } from '../../lib/provider-constants.js';
import { resolveApiKey } from '../../lib/key-resolver.js';

let client: GoogleGenAI | null = null;

function getGoogleClient(apiKey?: string): GoogleGenAI {
  // If custom API key provided, create new client
  if (apiKey) {
    return new GoogleGenAI({ apiKey });
  }

  // Otherwise use singleton with platform key
  if (!client) {
    client = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY || '' });
  }
  return client;
}

export class GoogleAdapter extends BaseProviderAdapter {
  protected provider: Provider = PROVIDER.GOOGLE;

  protected roleMappings: Record<Role, string> = {
    system: ADAPTER_HANDLED,
    user: 'user',
    assistant: 'model',
    tool: 'function',
    function: 'function',
    model: 'model',
    developer: 'system',
  };

  // Map Google finish reasons to Layer finish reasons
  protected finishReasonMappings: Record<string, FinishReason> = {
    STOP: 'completed',
    MAX_TOKENS: 'length_limit',
    SAFETY: 'filtered',
    RECITATION: 'filtered',
    FINISH_REASON_UNSPECIFIED: 'completed',
    OTHER: 'completed',
  };

  protected toolChoiceMappings: Record<string, FunctionCallingConfigMode> = {
    auto: FunctionCallingConfigMode.AUTO,
    none: FunctionCallingConfigMode.NONE,
    required: FunctionCallingConfigMode.ANY,
  };

  // Map Layer VideoSize to Veo aspect ratio and resolution
  protected videoSizeConfig: Record<
    VideoSize,
    { aspectRatio: string; resolution: string }
  > = {
    '720x1280': { aspectRatio: '9:16', resolution: '720p' },
    '1280x720': { aspectRatio: '16:9', resolution: '720p' },
    '1024x1792': { aspectRatio: '9:16', resolution: '1080p' },
    '1792x1024': { aspectRatio: '16:9', resolution: '1080p' },
  };

  async call(request: LayerRequest, userId?: string): Promise<LayerResponse> {
    // Resolve API key (BYOK → Platform key)
    const resolved = await resolveApiKey(
      this.provider,
      userId,
      process.env.GOOGLE_API_KEY
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
        return this.handleVideoGeneration(
          request,
          resolved.key,
          resolved.usedPlatformKey
        );
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
    const client = getGoogleClient(apiKey);
    const { data: chat, model } = request;

    if (!model) {
      throw new Error('Model is required for chat completion');
    }

    const contents: Content[] = [];
    let systemInstruction: string | undefined;

    // Handle system prompt
    if (chat.systemPrompt) {
      systemInstruction = chat.systemPrompt;
    }

    // Convert messages to Google format
    for (const msg of chat.messages) {
      const role = this.mapRole(msg.role);

      // Skip system messages (handled via systemInstruction)
      if (role === 'system') {
        systemInstruction = systemInstruction
          ? `${systemInstruction}\n${msg.content}`
          : msg.content;
        continue;
      }

      const parts: Part[] = [];

      // Handle text content
      if (msg.content) {
        parts.push({ text: msg.content });
      }

      // Handle images
      if (msg.images && msg.images.length > 0) {
        for (const image of msg.images) {
          if (image.base64) {
            parts.push({
              inlineData: {
                mimeType: image.mimeType || 'image/jpeg',
                data: image.base64,
              },
            });
          } else if (image.url) {
            parts.push({
              fileData: {
                mimeType: image.mimeType || 'image/jpeg',
                fileUri: image.url,
              },
            });
          }
        }
      }

      // Handle tool responses
      if (msg.toolCallId && msg.role === 'tool') {
        if (!msg.name) {
          throw new Error(
            'Tool response messages must include the function name'
          );
        }
        parts.push({
          functionResponse: {
            name: msg.name || msg.toolCallId,
            response: { result: msg.content },
          },
        });
      }

      // Handle assistant messages with tool calls
      if (msg.toolCalls && msg.toolCalls.length > 0) {
        for (const toolCall of msg.toolCalls) {
          parts.push({
            functionCall: {
              name: toolCall.function.name,
              args: JSON.parse(toolCall.function.arguments),
            },
          });
        }
      }

      if (parts.length > 0) {
        contents.push({
          role: role === 'model' ? 'model' : 'user',
          parts,
        });
      }
    }

    // Convert tools to Google format
    let googleTools: GoogleTool[] | undefined;
    if (chat.tools && chat.tools.length > 0) {
      googleTools = [
        {
          functionDeclarations: chat.tools.map((tool) => ({
            name: tool.function.name,
            description: tool.function.description,
            parametersJsonSchema: tool.function.parameters as Record<
              string,
              unknown
            >,
          })),
        },
      ];
    }

    // Map tool choice
    let toolConfig:
      | { functionCallingConfig?: { mode: FunctionCallingConfigMode } }
      | undefined;
    if (chat.toolChoice) {
      const mode = this.mapToolChoice(chat.toolChoice);
      if (typeof mode === 'string') {
        toolConfig = {
          functionCallingConfig: { mode: mode as FunctionCallingConfigMode },
        };
      }
    }

    const response = await client.models.generateContent({
      model: model,
      contents,
      config: {
        ...(systemInstruction && { systemInstruction }),
        ...(googleTools && { tools: googleTools }),
        ...(toolConfig && { toolConfig }),
        ...(chat.temperature !== undefined && {
          temperature: chat.temperature,
        }),
        ...(chat.maxTokens !== undefined && {
          maxOutputTokens: chat.maxTokens,
        }),
        ...(chat.topP !== undefined && { topP: chat.topP }),
        ...(chat.stopSequences !== undefined && {
          stopSequences: chat.stopSequences,
        }),
      },
    });

    const candidate = response.candidates?.[0];
    const content = candidate?.content;
    const textContent = content?.parts
      ?.filter((part) => 'text' in part)
      .map((part) => (part as { text: string }).text)
      .join('');

    // Extract tool calls
    const toolCalls = content?.parts
      ?.filter((part) => 'functionCall' in part)
      .map((part, index) => {
        const fc = (
          part as {
            functionCall: { name: string; args: Record<string, unknown> };
          }
        ).functionCall;
        return {
          id: `call_${index}_${fc.name}`,
          type: 'function' as const,
          function: {
            name: fc.name,
            arguments: JSON.stringify(fc.args),
          },
        };
      });

    const promptTokens = response.usageMetadata?.promptTokenCount || 0;
    const completionTokens = response.usageMetadata?.candidatesTokenCount || 0;
    const totalTokens = response.usageMetadata?.totalTokenCount || 0;
    const cost = this.calculateCost(model!, promptTokens, completionTokens);

    return {
      content: textContent || undefined,
      toolCalls: toolCalls && toolCalls.length > 0 ? toolCalls : undefined,
      model: response.modelVersion || model,
      finishReason: this.mapFinishReason(candidate?.finishReason || 'STOP'),
      rawFinishReason: candidate?.finishReason,
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
    const client = getGoogleClient(apiKey);
    const { data: image, model } = request;

    if (!model) {
      throw new Error('Model is required for chat completion');
    }

    // Google's Imagen API via generateImages
    const response = await client.models.generateImages({
      model: model,
      prompt: image.prompt,
      config: {
        numberOfImages: image.count || 1,
        ...(image.seed !== undefined && { seed: image.seed }),
      },
    });

    const images =
      response.generatedImages?.map((img) => ({
        base64: img.image?.imageBytes,
      })) || [];

    return {
      images,
      model: model,
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
    const client = getGoogleClient(apiKey);
    const { data: embedding, model } = request;

    if (!model) {
      throw new Error('Model is required for chat completion');
    }

    const inputs = Array.isArray(embedding.input)
      ? embedding.input
      : [embedding.input];

    const response = await client.models.embedContent({
      model: model,
      contents: inputs.map((text) => ({ parts: [{ text }] })),
    });

    const embeddings = response.embeddings?.map((e) => e.values || []) || [];

    return {
      embeddings,
      model: model,
      usage: {
        promptTokens: 0, // Google doesn't provide token count for embeddings
        completionTokens: 0,
        totalTokens: 0,
      },
      latencyMs: Date.now() - startTime,
      usedPlatformKey,
      raw: response,
    };
  }

  private async handleVideoGeneration(
    request: Extract<LayerRequest, { type: 'video' }>,
    apiKey: string,
    usedPlatformKey: boolean
  ): Promise<LayerResponse> {
    const startTime = Date.now();
    const client = getGoogleClient(apiKey);
    const { data: video, model } = request;

    if (!model) {
      throw new Error('Model is required for chat completion');
    }

    // Derive aspect ratio and resolution from size
    const sizeConfig = video.size ? this.videoSizeConfig[video.size] : null;
    const aspectRatio = sizeConfig?.aspectRatio || '16:9';
    const resolution = sizeConfig?.resolution || '720p';

    // Parse duration - Veo accepts 4, 6, or 8 seconds
    let durationSeconds: number | undefined;
    if (video.duration !== undefined) {
      const dur =
        typeof video.duration === 'string'
          ? parseInt(video.duration, 10)
          : video.duration;
      // Veo supports 4, 6, or 8 seconds
      if (dur <= 5) durationSeconds = 5;
      else if (dur <= 6) durationSeconds = 6;
      else durationSeconds = 8;
    }

    // Build reference images for Veo 3.1
    let referenceImages: VideoGenerationReferenceImage[] | undefined;
    if (video.referenceImages && video.referenceImages.length > 0) {
      const refTypeMap: Record<string, VideoGenerationReferenceType> = {
        subject: VideoGenerationReferenceType.ASSET,
        style: VideoGenerationReferenceType.STYLE,
        asset: VideoGenerationReferenceType.ASSET,
      };
      referenceImages = video.referenceImages.slice(0, 3).map((ref) => ({
        image: ref.base64 ? { imageBytes: ref.base64 } : { imageUri: ref.url },
        referenceType: refTypeMap[ref.referenceType || 'asset'],
      }));
    }

    // Build starting image if provided
    let image: { imageBytes?: string; imageUri?: string } | undefined;
    if (video.image) {
      image = video.image.base64
        ? { imageBytes: video.image.base64 }
        : { imageUri: video.image.url };
    }

    // Build last frame for interpolation
    let lastFrame: { imageBytes?: string; imageUri?: string } | undefined;
    if (video.lastFrame) {
      lastFrame = video.lastFrame.base64
        ? { imageBytes: video.lastFrame.base64 }
        : { imageUri: video.lastFrame.url };
    }

    // Start the video generation operation
    let operation = await client.models.generateVideos({
      model: model,
      prompt: video.prompt,
      ...(image && { image }),
      config: {
        aspectRatio,
        resolution,
        ...(durationSeconds !== undefined && { durationSeconds }),
        ...(video.seed !== undefined && { seed: video.seed }),
        ...(video.negativePrompt && { negativePrompt: video.negativePrompt }),
        ...(video.personGeneration && {
          personGeneration: video.personGeneration,
        }),
        ...(video.numberOfVideos && { numberOfVideos: video.numberOfVideos }),
        ...(referenceImages && { referenceImages }),
        ...(lastFrame && { lastFrame }),
      },
    });

    // Poll until the operation completes
    // Veo operations can take 11 seconds to 6 minutes
    const pollIntervalMs = 5000; // Poll every 5 seconds
    const maxWaitMs = 10 * 60 * 1000; // Max wait 10 minutes
    const startPoll = Date.now();

    while (!operation.done) {
      if (Date.now() - startPoll > maxWaitMs) {
        throw new Error('Video generation timed out after 10 minutes');
      }
      await this.sleep(pollIntervalMs);
      operation = (await client.operations.get({
        operation: operation,
      })) as GenerateVideosOperation;
    }

    // Extract generated videos
    const generatedVideos = operation.response?.generatedVideos || [];
    const videos = generatedVideos.map((vid) => {
      if (vid.video) {
        return {
          url: vid.video.uri,
          duration: durationSeconds,
        };
      }
      return {};
    });

    return {
      videos: videos.filter((v) => v.url),
      model: model!,
      latencyMs: Date.now() - startTime,
      usedPlatformKey,
      raw: operation.response,
    };
  }

  private async handleTextToSpeech(
    request: Extract<LayerRequest, { type: 'tts' }>,
    apiKey: string,
    usedPlatformKey: boolean
  ): Promise<LayerResponse> {
    const startTime = Date.now();
    const client = getGoogleClient(apiKey);
    const { data: tts, model } = request;

    if (!model) {
      throw new Error('Model is required for chat completion');
    }

    const response = await client.models.generateContent({
      model: model,
      contents: tts.input,
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: tts.voice || 'Kore',
            },
          },
        },
      },
    });

    const audioData =
      response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    return {
      audio: {
        base64: audioData,
        format: 'wav',
      },
      model: model,
      latencyMs: Date.now() - startTime,
      usedPlatformKey,
      raw: response,
    };
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
