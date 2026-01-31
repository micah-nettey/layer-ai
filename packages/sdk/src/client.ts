import type { LayerConfig, RequestOptions } from './types/index.js';
import type {
  ErrorResponse,
  LayerRequestInput,
  LayerResponse,
  ChatRequest,
  ImageGenerationRequest,
  VideoGenerationRequest,
  EmbeddingsRequest,
  TextToSpeechRequest,
  OCRRequest,
} from './types/index.js';

export class Layer {
  private apiKey: string;
  private baseUrl: string;

  constructor(config: LayerConfig) {
    if (!config.apiKey) {
      throw new Error('Layer API key is required');
    }
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || 'https://api.uselayer.ai';
  }

  public async request<T>(options: RequestOptions): Promise<T> {
    const { method, path, body } = options;
    const url = `${this.baseUrl}${path}`;

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    // Handle 204 No Content responses (e.g., DELETE operations)
    if (response.status === 204) {
      return undefined as T;
    }

    const data = await response.json();

    if (!response.ok) {
      const error = data as ErrorResponse;
      throw new Error(error.message || error.error);
    }

    return data as T;
  }

  async complete(request: LayerRequestInput): Promise<LayerResponse> {
    return this.request<LayerResponse>({
      method: 'POST',
      path: '/v2/complete',
      body: request,
    });
  }

  /**
   * v3 Chat completion endpoint - Type-safe chat requests
   * @param request - Chat request with gateId and ChatRequest data
   */
  async chat(request: {
    gateId: string;
    data: ChatRequest;
    model?: string;
    metadata?: Record<string, unknown>;
  }): Promise<LayerResponse> {
    return this.request<LayerResponse>({
      method: 'POST',
      path: '/v3/chat',
      body: request,
    });
  }

  /**
   * v3 Image generation endpoint - Type-safe image requests
   * @param request - Image request with gateId and ImageGenerationRequest data
   */
  async image(request: {
    gateId: string;
    data: ImageGenerationRequest;
    model?: string;
    metadata?: Record<string, unknown>;
  }): Promise<LayerResponse> {
    return this.request<LayerResponse>({
      method: 'POST',
      path: '/v3/image',
      body: request,
    });
  }

  /**
   * v3 Video generation endpoint - Type-safe video requests
   * @param request - Video request with gateId and VideoGenerationRequest data
   */
  async video(request: {
    gateId: string;
    data: VideoGenerationRequest;
    model?: string;
    metadata?: Record<string, unknown>;
  }): Promise<LayerResponse> {
    return this.request<LayerResponse>({
      method: 'POST',
      path: '/v3/video',
      body: request,
    });
  }

  /**
   * v3 Embeddings endpoint - Type-safe embeddings requests
   * @param request - Embeddings request with gateId and EmbeddingsRequest data
   */
  async embeddings(request: {
    gateId: string;
    data: EmbeddingsRequest;
    model?: string;
    metadata?: Record<string, unknown>;
  }): Promise<LayerResponse> {
    return this.request<LayerResponse>({
      method: 'POST',
      path: '/v3/embeddings',
      body: request,
    });
  }

  /**
   * v3 Text-to-Speech endpoint - Type-safe TTS requests
   * @param request - TTS request with gateId and TextToSpeechRequest data
   */
  async tts(request: {
    gateId: string;
    data: TextToSpeechRequest;
    model?: string;
    metadata?: Record<string, unknown>;
  }): Promise<LayerResponse> {
    return this.request<LayerResponse>({
      method: 'POST',
      path: '/v3/tts',
      body: request,
    });
  }

  /**
   * v3 OCR endpoint - Type-safe OCR requests
   * @param request - OCR request with gateId and OCRRequest data
   */
  async ocr(request: {
    gateId: string;
    data: OCRRequest;
    model?: string;
    metadata?: Record<string, unknown>;
  }): Promise<LayerResponse> {
    return this.request<LayerResponse>({
      method: 'POST',
      path: '/v3/ocr',
      body: request,
    });
  }
}
