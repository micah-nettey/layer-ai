// ====== NORMALIZED TYPES (BASED ON OPENAI) ======

// Error response
export interface ErrorResponse {
  error: string;
  message: string;
  details?: any;
}

export type Role =
  | 'system'
  | 'user'
  | 'assistant'
  | 'tool'
  | 'function'
  | 'model'
  | 'developer';

export type ImageDetail = 'auto' | 'low' | 'high';

export type ImageSize =
  | '256x256'
  | '512x512'
  | '1024x1024'
  | '1792x1024'
  | '1024x1792'
  | '1536x1024'
  | '1024x1536';

export type ImageQuality = 'standard' | 'hd';

export type ImageStyle = 'vivid' | 'natural';

export type AudioFormat = 'mp3' | 'opus' | 'aac' | 'flac' | 'wav' | 'pcm';

export type VideoSize = '720x1280' | '1280x720' | '1024x1792' | '1792x1024';

export type AudioMimeType =
  | 'audio/mpeg'
  | 'audio/mp4'
  | 'audio/wav'
  | 'audio/webm'
  | 'audio/ogg'
  | 'audio/flac';

export type ImageMimeType =
  | 'image/jpeg'
  | 'image/png'
  | 'image/gif'
  | 'image/webp';

export type ToolChoice =
  | 'auto'
  | 'required'
  | 'none'
  | {
      type: 'function';
      function: {
        name: string;
      };
    };

export type FinishReason =
  | 'completed'
  | 'length_limit'
  | 'tool_call'
  | 'filtered'
  | 'error';

export type ResponseFormatType = 'text' | 'json_object' | 'json_schema';

export type EncodingFormat = 'float' | 'base64';

export const ADAPTER_HANDLED = '__ADAPTER_HANDLED__';

// ====== LAYER REQUEST ======

type BaseRequest = {
  /**
   * Gate identifier. Use gate ID.
   *
   * @example
   * gate: "123e4567-e89b-12d3-a456-426614174000"
   */
  gateId: string; // required: Gate UUID only
  gateName?: string; // optional: for display purposes only
  model?: string; // overrides the model in code if provided
  metadata?: Record<string, unknown>;
};

/**
 * Task type determines how request data is interpreted.
 * When omitted, defaults to the gate's configured taskType.
 */
export type TaskType =
  | 'chat'
  | 'image'
  | 'video'
  | 'embeddings'
  | 'tts'
  | 'ocr';

/**
 * Internal LayerRequest type with required type field (used by API after type resolution)
 */
export type LayerRequest =
  | (BaseRequest & { type: 'chat'; data: ChatRequest })
  | (BaseRequest & { type: 'image'; data: ImageGenerationRequest })
  | (BaseRequest & { type: 'video'; data: VideoGenerationRequest })
  | (BaseRequest & { type: 'embeddings'; data: EmbeddingsRequest })
  | (BaseRequest & { type: 'tts'; data: TextToSpeechRequest })
  | (BaseRequest & { type: 'ocr'; data: OCRRequest });

/**
 * User-facing LayerRequest type with optional type field.
 * Type defaults to gate's taskType when omitted, but can be overridden.
 */
export type LayerRequestInput =
  | (BaseRequest & { type?: 'chat'; data: ChatRequest })
  | (BaseRequest & { type?: 'image'; data: ImageGenerationRequest })
  | (BaseRequest & { type?: 'video'; data: VideoGenerationRequest })
  | (BaseRequest & { type?: 'embeddings'; data: EmbeddingsRequest })
  | (BaseRequest & { type?: 'tts'; data: TextToSpeechRequest })
  | (BaseRequest & { type?: 'ocr'; data: OCRRequest });

// ====== CHAT/COMPLETION REQUEST ======

export interface ChatRequest {
  messages: MultimodalMessage[];
  systemPrompt?: string;
  tools?: Tool[];
  toolChoice?: ToolChoice;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  stream?: boolean;
  stopSequences?: string[];
  frequencyPenalty?: number;
  presencePenalty?: number;
  responseFormat?:
    | ResponseFormatType
    | {
        type: ResponseFormatType;
        json_schema?: unknown;
      };
  seed?: number;
}

export interface MultimodalMessage {
  role: Role;
  content?: string;
  images?: ImageInput[];
  audio?: AudioInput;
  toolCallId?: string;
  toolCalls?: ToolCall[];
  name?: string;
}

export interface ImageInput {
  url?: string;
  base64?: string;
  mimeType?: ImageMimeType;
  detail?: ImageDetail;
}

export interface AudioInput {
  url?: string;
  base64?: string;
  mimeType?: AudioMimeType;
  format?: AudioFormat;
}

export interface Tool {
  type: 'function';
  function: {
    name: string;
    description?: string;
    parameters?: {
      type: 'object' | 'string' | 'number' | 'boolean' | 'array';
      properties?: Record<string, unknown>;
      required?: string[];
    };
  };
}

export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

// ====== IMAGE GENERATION REQUEST ======

export interface ImageGenerationRequest {
  prompt: string;
  size?: ImageSize;
  quality?: ImageQuality;
  count?: number;
  style?: ImageStyle;
  seed?: number;
}

// ====== VIDEO GENERATION REQUEST ======

export type VideoReferenceType = 'subject' | 'style' | 'asset';

export interface VideoReferenceImage {
  url?: string;
  base64?: string;
  referenceType?: VideoReferenceType;
}

export interface VideoImageInput {
  url?: string;
  base64?: string;
}

export interface VideoGenerationRequest {
  prompt: string;
  duration?: number | string;
  size?: VideoSize;
  fps?: number;
  seed?: number;
  negativePrompt?: string;
  numberOfVideos?: number;
  personGeneration?: string;
  image?: VideoImageInput;
  lastFrame?: VideoImageInput;
  referenceImages?: VideoReferenceImage[];
}

// ====== EMBEDDINGS REQUEST ======

export interface EmbeddingsRequest {
  input: string | string[];
  dimensions?: number;
  encodingFormat?: EncodingFormat;
}

// ====== TEXT-TO-SPEECH REQUEST ======

export interface TextToSpeechRequest {
  input: string;
  voice?: string;
  speed?: number;
  responseFormat?: AudioFormat;
}

// ====== OCR REQUEST ======

export type OCRDocumentType = 'document_url' | 'image_url' | 'base64';
export type OCRTableFormat = 'markdown' | 'html';

export interface OCRRequest {
  documentUrl?: string;
  imageUrl?: string;
  base64?: string;
  mimeType?: string;
  tableFormat?: OCRTableFormat;
  includeImageBase64?: boolean;
  extractHeader?: boolean;
  extractFooter?: boolean;
}

// ====== OCR RESPONSE ======

export interface OCRPage {
  index: number;
  markdown: string;
  images?: Array<{
    id: string;
    base64?: string;
    topLeftX?: number;
    topLeftY?: number;
    bottomRightX?: number;
    bottomRightY?: number;
  }>;
  tables?: Array<{
    id: string;
    html?: string;
  }>;
  hyperlinks?: Array<{
    text: string;
    url: string;
  }>;
  header?: string | null;
  footer?: string | null;
  dimensions?: {
    width: number;
    height: number;
    dpi?: number;
  };
}

export interface OCROutput {
  pages: OCRPage[];
  model: string;
  documentAnnotation?: Record<string, unknown> | null;
  usageInfo?: {
    pagesProcessed?: number;
    docSizeBytes?: number;
  };
}

// ====== LAYER RESPONSE ======

export interface LayerResponse {
  id?: string;
  created?: number;
  content?: string;
  images?: ImageOutput[];
  videos?: VideoOutput[];
  audio?: AudioOutput;
  embeddings?: number[][];
  ocr?: OCROutput;
  toolCalls?: ToolCall[];
  model?: string;
  finishReason?: FinishReason;
  rawFinishReason?: string;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
  stream?: boolean;
  cost?: number;
  latencyMs?: number;
  usedPlatformKey?: boolean;
  raw?: unknown;
}

export interface ImageOutput {
  url?: string;
  base64?: string;
  revisedPrompt?: string;
}

export interface VideoOutput {
  url?: string;
  base64?: string;
  duration?: number;
  revisedPrompt?: string;
}

export interface AudioOutput {
  url?: string;
  base64?: string;
  format?: AudioFormat;
  text?: string;
  duration?: number;
}
