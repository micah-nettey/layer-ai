// AUTO-GENERATED FILE - DO NOT EDIT MANUALLY
// Generated at: 2026-01-29T05:32:54.519Z
// Source: Internal Model Registry API
// To update: Run `pnpm sync:registry`
//
// Registry version: 2026-01-29
// Last sync: 2026-01-29T05:32:54.514Z
// Total models: 77

// Providers we support with adapters
export const SUPPORTED_PROVIDERS = [
  'openai',
  'anthropic',
  'google',
  'mistral',
] as const;
export type SupportedProvider = (typeof SUPPORTED_PROVIDERS)[number];

export type ModelType =
  | 'chat' // Chat/completion models (GPT-4, Claude, Gemini)
  | 'image' // Image generation (DALL-E, Stable Diffusion)
  | 'video' // Video generation
  | 'audio' // Audio generation (music, sound effects)
  | 'tts' // Text-to-speech
  | 'stt' // Speech-to-text (Whisper)
  | 'embeddings' // Text embeddings
  | 'document' // Document processing (OCR)
  | 'responses' // Reasoning models (o3-pro)
  | 'language-completion'; // Legacy completion API

// Base interface for all models
interface BaseModelEntry {
  type: ModelType;
  provider: string;
  displayName: string;
  description?: string;
  pricing?: {
    input?: number; // Cost per 1K input tokens/units
    output?: number; // Cost per 1K output tokens/units
  };
  deprecated?: boolean; // Model is deprecated, prevent new usage
  deprecationDate?: string; // When the model was/will be deprecated
  shutdownDate?: string; // When the model will be shut down
  replacementModel?: string; // Suggested replacement model ID
  isAvailable?: boolean; // Available for use (NOT deprecated AND accessible via API)
  lastUpdated?: string;
}

// Chat/completion models with benchmarks and performance
export interface ChatModelEntry extends BaseModelEntry {
  type: 'chat' | 'responses' | 'language-completion';
  contextLength?: number;
  maxTokens?: number;
  benchmarks?: {
    intelligence?: number;
    coding?: number;
    math?: number;
    mmluPro?: number;
    gpqa?: number;
  };
  performance?: {
    outputTokenPerSecond?: number;
    timeTofirstToken?: number;
    intelligenceScore?: number;
  };
  context?: {
    window?: number;
    input: {
      text: boolean;
      image: boolean;
      audio: boolean;
      video: boolean;
    };
    output: {
      text: boolean;
      image: boolean;
      audio: boolean;
      video: boolean;
    };
  };
}

// Image generation models
export interface ImageModelEntry extends BaseModelEntry {
  type: 'image';
  imagePricing?: number | Record<string, number>; // Flat rate or per-size/quality pricing
}

// Video generation models
export interface VideoModelEntry extends BaseModelEntry {
  type: 'video';
}

// Audio generation models
export interface AudioModelEntry extends BaseModelEntry {
  type: 'audio';
}

// Text-to-speech models
export interface TTSModelEntry extends BaseModelEntry {
  type: 'tts';
}

// Speech-to-text models
export interface STTModelEntry extends BaseModelEntry {
  type: 'stt';
}

// Embeddings models
export interface EmbeddingsModelEntry extends BaseModelEntry {
  type: 'embeddings';
  contextLength?: number;
}

// Document processing models
export interface DocumentModelEntry extends BaseModelEntry {
  type: 'document';
}

// Union type for all model entries
export type ModelEntry =
  | ChatModelEntry
  | ImageModelEntry
  | VideoModelEntry
  | AudioModelEntry
  | TTSModelEntry
  | STTModelEntry
  | EmbeddingsModelEntry
  | DocumentModelEntry;

export const MODEL_REGISTRY = {
  'claude-3-7-sonnet-20250219': {
    type: 'chat' as const,
    provider: 'anthropic' as const,
    displayName: 'Claude Sonnet 3.7',
    description: 'Legacy model - recommend migrating to Claude 4.5',
    pricing: { input: 3, output: 15 },
    benchmarks: {
      intelligence: 34.6,
      coding: 27.6,
      math: 56.3,
      mmluPro: 0.84,
      gpqa: 0.77,
    },
    performance: {
      intelligenceScore: 34.6,
    },
    contextLength: 200000,
    context: {
      input: {
        text: true,
        audio: false,
        image: true,
        video: false,
      },
      output: {
        text: true,
        audio: false,
        image: false,
        video: false,
      },
    },
    deprecated: false,
    isAvailable: true,
    lastUpdated: '2026-01-25',
  },
  'claude-3-haiku-20240307': {
    type: 'chat' as const,
    provider: 'anthropic' as const,
    displayName: 'Claude Haiku 3',
    description: 'Legacy model - recommend migrating to Claude 4.5',
    pricing: { input: 0.25, output: 1.25 },
    benchmarks: {
      intelligence: 1,
      coding: 7.8,
      mmluPro: 0.43,
      gpqa: 0.33,
    },
    performance: {
      intelligenceScore: 1,
    },
    contextLength: 200000,
    context: {
      input: {
        text: true,
        audio: false,
        image: true,
        video: false,
      },
      output: {
        text: true,
        audio: false,
        image: false,
        video: false,
      },
    },
    deprecated: false,
    isAvailable: true,
    lastUpdated: '2026-01-25',
  },
  'claude-haiku-4-5-20251001': {
    type: 'chat' as const,
    provider: 'anthropic' as const,
    displayName: 'Claude Haiku 4.5',
    description: 'Our fastest model with near-frontier intelligence',
    pricing: { input: 1, output: 5 },
    benchmarks: {
      intelligence: 7.4,
      coding: 7.8,
      mmluPro: 0.43,
      gpqa: 0.33,
    },
    performance: {
      intelligenceScore: 7.4,
    },
    contextLength: 200000,
    context: {
      input: {
        text: true,
        audio: false,
        image: true,
        video: false,
      },
      output: {
        text: true,
        audio: false,
        image: false,
        video: false,
      },
    },
    deprecated: false,
    isAvailable: true,
    lastUpdated: '2026-01-25',
  },
  'claude-opus-4-1-20250805': {
    type: 'chat' as const,
    provider: 'anthropic' as const,
    displayName: 'Claude Opus 4.1',
    description: 'Legacy model - recommend migrating to Claude 4.5',
    pricing: { input: 15, output: 75 },
    benchmarks: {
      intelligence: 9.3,
      coding: 14,
      mmluPro: 0.5,
      gpqa: 0.32,
    },
    performance: {
      intelligenceScore: 9.3,
    },
    contextLength: 200000,
    context: {
      input: {
        text: true,
        audio: false,
        image: true,
        video: false,
      },
      output: {
        text: true,
        audio: false,
        image: false,
        video: false,
      },
    },
    deprecated: false,
    isAvailable: true,
    lastUpdated: '2026-01-25',
  },
  'claude-opus-4-5-20251101': {
    type: 'chat' as const,
    provider: 'anthropic' as const,
    displayName: 'Claude Opus 4.5',
    description:
      'Premium model combining maximum intelligence with practical performance',
    pricing: { input: 5, output: 25 },
    benchmarks: {
      intelligence: 43,
      coding: 42.9,
      math: 62.7,
      mmluPro: 0.89,
      gpqa: 0.81,
    },
    performance: {
      intelligenceScore: 43,
    },
    contextLength: 200000,
    context: {
      input: {
        text: true,
        audio: false,
        image: true,
        video: false,
      },
      output: {
        text: true,
        audio: false,
        image: false,
        video: false,
      },
    },
    deprecated: false,
    isAvailable: true,
    lastUpdated: '2026-01-25',
  },
  'claude-sonnet-4-20250514': {
    type: 'chat' as const,
    provider: 'anthropic' as const,
    displayName: 'Claude Sonnet 4',
    description: 'Legacy model - recommend migrating to Claude 4.5',
    pricing: { input: 3, output: 15 },
    benchmarks: {
      intelligence: 33,
      coding: 30.6,
      math: 38,
      mmluPro: 0.84,
      gpqa: 0.68,
    },
    performance: {
      intelligenceScore: 33,
    },
    contextLength: 200000,
    context: {
      input: {
        text: true,
        audio: false,
        image: true,
        video: false,
      },
      output: {
        text: true,
        audio: false,
        image: false,
        video: false,
      },
    },
    deprecated: false,
    isAvailable: true,
    lastUpdated: '2026-01-25',
  },
  'claude-sonnet-4-5-20250929': {
    type: 'chat' as const,
    provider: 'anthropic' as const,
    displayName: 'Claude Sonnet 4.5',
    description: 'Our smart model for complex agents and coding',
    pricing: { input: 3, output: 15 },
    benchmarks: {
      intelligence: 37.1,
      coding: 33.5,
      math: 37,
      mmluPro: 0.86,
      gpqa: 0.73,
    },
    performance: {
      intelligenceScore: 37.1,
    },
    contextLength: 200000,
    context: {
      input: {
        text: true,
        audio: false,
        image: true,
        video: false,
      },
      output: {
        text: true,
        audio: false,
        image: false,
        video: false,
      },
    },
    deprecated: false,
    isAvailable: true,
    lastUpdated: '2026-01-25',
  },
  'gemini-2.0-flash': {
    type: 'chat' as const,
    provider: 'google' as const,
    displayName: 'Gemini 2.0 Flash',
    description:
      'Gemini 2.0 Flash delivers next-gen features and improved capabilities, including superior speed, native tool use, and a 1M token context window.',
    pricing: { input: 0.1, output: 0.4 },
    benchmarks: {
      intelligence: 12.3,
    },
    performance: {
      intelligenceScore: 12.3,
    },
    contextLength: 1048576,
    context: {
      input: {
        text: true,
        audio: true,
        image: true,
        video: true,
      },
      output: {
        text: true,
        audio: false,
        image: false,
        video: false,
      },
    },
    deprecated: false,
    isAvailable: true,
    lastUpdated: '2026-01-25',
  },
  'gemini-2.0-flash-lite': {
    type: 'chat' as const,
    provider: 'google' as const,
    displayName: 'Gemini 2.0 Flash-Lite',
    description:
      'A Gemini 2.0 Flash model optimized for cost efficiency and low latency.',
    pricing: { input: 0.075, output: 0.3 },
    benchmarks: {
      intelligence: 14.7,
      mmluPro: 0.72,
      gpqa: 0.54,
    },
    performance: {
      intelligenceScore: 14.7,
    },
    contextLength: 1048576,
    context: {
      input: {
        text: true,
        audio: true,
        image: true,
        video: true,
      },
      output: {
        text: true,
        audio: false,
        image: false,
        video: false,
      },
    },
    deprecated: false,
    isAvailable: true,
    lastUpdated: '2026-01-25',
  },
  'gemini-2.5-flash': {
    type: 'chat' as const,
    provider: 'google' as const,
    displayName: 'Gemini 2.5 Flash',
    description:
      'Our best model in terms of price-performance, offering well-rounded capabilities. 2.5 Flash is best for large scale processing, low-latency, high volume tasks that require thinking, and agentic use cases.',
    pricing: { input: 0.3, output: 2.5 },
    benchmarks: {
      intelligence: 25.5,
      coding: 22.1,
      math: 56.7,
      mmluPro: 0.84,
      gpqa: 0.77,
    },
    performance: {
      intelligenceScore: 25.5,
    },
    contextLength: 1048576,
    context: {
      input: {
        text: true,
        audio: true,
        image: true,
        video: true,
      },
      output: {
        text: true,
        audio: false,
        image: false,
        video: false,
      },
    },
    deprecated: false,
    isAvailable: true,
    lastUpdated: '2026-01-25',
  },
  'gemini-2.5-flash-lite': {
    type: 'chat' as const,
    provider: 'google' as const,
    displayName: 'Gemini 2.5 Flash-Lite',
    description:
      'Our fastest flash model optimized for cost-efficiency and high throughput.',
    pricing: { input: 0.1, output: 0.4 },
    benchmarks: {
      intelligence: 17.4,
      coding: 9.5,
      math: 53.3,
      mmluPro: 0.76,
      gpqa: 0.63,
    },
    performance: {
      intelligenceScore: 17.4,
    },
    contextLength: 1048576,
    context: {
      input: {
        pdf: true,
        text: true,
        audio: true,
        image: true,
        video: true,
      },
      output: {
        text: true,
        audio: false,
        image: false,
        video: false,
      },
    },
    deprecated: false,
    isAvailable: true,
    lastUpdated: '2026-01-25',
  },
  'gemini-2.5-flash-preview-tts': {
    type: 'tts' as const,
    provider: 'google' as const,
    displayName: 'Gemini 2.5 Flash TTS',
    pricing: { input: 0.5, output: 10 },
    contextLength: 8192,
    context: {
      input: {
        text: true,
        audio: false,
        image: false,
        video: false,
      },
      output: {
        text: false,
        audio: true,
        image: false,
        video: false,
      },
    },
    deprecated: false,
    isAvailable: true,
    lastUpdated: '2026-01-25',
  },
  'gemini-2.5-pro': {
    type: 'chat' as const,
    provider: 'google' as const,
    displayName: 'Gemini 2.5 Pro',
    description:
      'Our state-of-the-art thinking model, capable of reasoning over complex problems in code, math, and STEM, as well as analyzing large datasets, codebases, and documents using long context.',
    pricing: { input: 1.25, output: 10 },
    benchmarks: {
      intelligence: 30.3,
      coding: 46.7,
      mmluPro: 0.86,
      gpqa: 0.84,
    },
    performance: {
      intelligenceScore: 30.3,
    },
    contextLength: 1048576,
    context: {
      input: {
        pdf: true,
        text: true,
        audio: true,
        image: true,
        video: true,
      },
      output: {
        text: true,
        audio: false,
        image: false,
        video: false,
      },
    },
    deprecated: false,
    isAvailable: true,
    lastUpdated: '2026-01-25',
  },
  'gemini-2.5-pro-preview-tts': {
    type: 'tts' as const,
    provider: 'google' as const,
    displayName: 'Gemini 2.5 Pro TTS',
    pricing: { input: 1, output: 20 },
    contextLength: 8192,
    context: {
      input: {
        text: true,
        audio: false,
        image: false,
        video: false,
      },
      output: {
        text: false,
        audio: true,
        image: false,
        video: false,
      },
    },
    deprecated: false,
    isAvailable: true,
    lastUpdated: '2026-01-25',
  },
  'gemini-3-flash-preview': {
    type: 'chat' as const,
    provider: 'google' as const,
    displayName: 'Gemini 3 Flash Preview',
    description:
      'Our most balanced model built for speed, scale, and frontier intelligence.',
    pricing: { input: 0.5, output: 3 },
    benchmarks: {
      intelligence: 35.1,
      coding: 37.8,
      math: 55.7,
      mmluPro: 0.88,
      gpqa: 0.81,
    },
    performance: {
      intelligenceScore: 35.1,
    },
    contextLength: 1048576,
    context: {
      input: {
        pdf: true,
        text: true,
        audio: true,
        image: true,
        video: true,
      },
      output: {
        text: true,
        audio: false,
        image: false,
        video: false,
      },
    },
    deprecated: false,
    isAvailable: true,
    lastUpdated: '2026-01-25',
  },
  'gemini-3-pro-preview': {
    type: 'chat' as const,
    provider: 'google' as const,
    displayName: 'Gemini 3 Pro Preview',
    description:
      'The best model in the world for multimodal understanding, and our most powerful agentic and vibe-coding model yet, delivering richer visuals and deeper interactivity, all built on a foundation of state-of-the-art reasoning.',
    pricing: { input: 2, output: 12 },
    benchmarks: {
      intelligence: 41.1,
      coding: 39.4,
      math: 86.7,
      mmluPro: 0.9,
      gpqa: 0.89,
    },
    performance: {
      intelligenceScore: 41.1,
    },
    contextLength: 1048576,
    context: {
      input: {
        pdf: true,
        text: true,
        audio: true,
        image: true,
        video: true,
      },
      output: {
        text: true,
        audio: false,
        image: false,
        video: false,
      },
    },
    deprecated: false,
    isAvailable: true,
    lastUpdated: '2026-01-25',
  },
  'gemini-robotics-er-1.5-preview': {
    type: 'chat' as const,
    provider: 'google' as const,
    displayName: 'Gemini Robotics ER 1.5 Preview',
    pricing: { input: 0.3, output: 2.5 },
    context: {
      input: {
        text: true,
        audio: false,
        image: false,
        video: false,
      },
      output: {
        text: true,
        audio: false,
        image: false,
        video: false,
      },
    },
    deprecated: false,
    isAvailable: true,
    lastUpdated: '2026-01-25',
  },
  'gemma-3-27b-it': {
    type: 'chat' as const,
    provider: 'google' as const,
    displayName: 'Gemma 3 27B IT',
    description: 'Large instruction-tuned Gemma model',
    pricing: { input: 0, output: 0 },
    benchmarks: {
      intelligence: 10.1,
      mmluPro: 0.48,
      gpqa: 0.28,
    },
    performance: {
      intelligenceScore: 10.1,
    },
    context: {
      input: {
        text: true,
        audio: false,
        image: false,
        video: false,
      },
      output: {
        text: true,
        audio: false,
        image: false,
        video: false,
      },
    },
    deprecated: false,
    isAvailable: true,
    lastUpdated: '2026-01-25',
  },
  'imagen-4.0-fast-generate-001': {
    type: 'image' as const,
    provider: 'google' as const,
    displayName: 'Imagen 4.0 Fast',
    imagePricing: 0.02,
    context: {
      input: {
        text: true,
        audio: false,
        image: false,
        video: false,
      },
      output: {
        text: false,
        audio: false,
        image: true,
        video: false,
      },
    },
    deprecated: false,
    isAvailable: true,
    lastUpdated: '2026-01-25',
  },
  'imagen-4.0-ultra-generate-001': {
    type: 'image' as const,
    provider: 'google' as const,
    displayName: 'Imagen 4.0 Ultra',
    imagePricing: 0.06,
    context: {
      input: {
        text: true,
        audio: false,
        image: false,
        video: false,
      },
      output: {
        text: false,
        audio: false,
        image: true,
        video: false,
      },
    },
    deprecated: false,
    isAvailable: true,
    lastUpdated: '2026-01-25',
  },
  'text-embedding-004': {
    type: 'embedding' as const,
    provider: 'google' as const,
    displayName: 'Text Embedding 004',
    pricing: { input: 0.15 },
    context: {
      input: {
        text: true,
        audio: false,
        image: false,
        video: false,
      },
      output: {
        text: false,
        audio: false,
        image: false,
        video: false,
      },
    },
    deprecated: false,
    isAvailable: true,
    lastUpdated: '2026-01-25',
  },
  'veo-3.1-fast-generate-preview': {
    type: 'video' as const,
    provider: 'google' as const,
    displayName: 'Veo 3.1 Fast',
    context: {
      input: {
        text: true,
        audio: false,
        image: false,
        video: false,
      },
      output: {
        text: false,
        audio: false,
        image: false,
        video: true,
      },
    },
    deprecated: false,
    isAvailable: true,
    lastUpdated: '2026-01-25',
  },
  'veo-3.1-generate-preview': {
    type: 'video' as const,
    provider: 'google' as const,
    displayName: 'Veo 3.1',
    context: {
      input: {
        text: true,
        audio: false,
        image: false,
        video: false,
      },
      output: {
        text: false,
        audio: false,
        image: false,
        video: true,
      },
    },
    deprecated: false,
    isAvailable: true,
    lastUpdated: '2026-01-25',
  },
  'codestral-2412': {
    type: 'chat' as const,
    provider: 'mistral' as const,
    displayName: 'Codestral',
    description:
      'Our cutting-edge language model for code completion released end of July 2025.',
    benchmarks: {
      intelligence: 68.5,
      coding: 53.5,
      math: 98.7,
      mmluPro: 0.87,
      gpqa: 0.84,
    },
    performance: {
      intelligenceScore: 68.5,
    },
    context: {
      input: {
        text: true,
        audio: false,
        image: false,
        video: false,
      },
      output: {
        text: true,
        audio: false,
        image: false,
        video: false,
      },
    },
    deprecated: false,
    isAvailable: true,
    lastUpdated: '2026-01-25',
  },
  'codestral-2508': {
    type: 'chat' as const,
    provider: 'mistral' as const,
    displayName: 'Codestral',
    description:
      'Our cutting-edge language model for code completion released end of July 2025.',
    context: {
      input: {
        text: true,
        audio: false,
        image: false,
        video: false,
      },
      output: {
        text: true,
        audio: false,
        image: false,
        video: false,
      },
    },
    deprecated: false,
    isAvailable: true,
    lastUpdated: '2026-01-25',
  },
  'codestral-embed-2505': {
    type: 'embedding' as const,
    provider: 'mistral' as const,
    displayName: 'Codestral Embed',
    description:
      'Our state-of-the-art semantic for extracting representation of code extracts',
    pricing: { input: 0.15, output: 0 },
    context: {
      input: {
        text: true,
        audio: false,
        image: false,
        video: false,
      },
      output: {
        text: true,
        audio: false,
        image: false,
        video: false,
      },
    },
    deprecated: false,
    isAvailable: true,
    lastUpdated: '2026-01-25',
  },
  'devstral-2512': {
    type: 'chat' as const,
    provider: 'mistral' as const,
    displayName: 'Devstral 2',
    description:
      'Our frontier code agents model for solving software engineering tasks.',
    benchmarks: {
      intelligence: 18.6,
      coding: 15.9,
      math: 4.7,
      mmluPro: 0.71,
      gpqa: 0.49,
    },
    performance: {
      intelligenceScore: 18.6,
    },
    context: {
      input: {
        text: true,
        audio: false,
        image: false,
        video: false,
      },
      output: {
        text: true,
        audio: false,
        image: false,
        video: false,
      },
    },
    deprecated: false,
    isAvailable: true,
    lastUpdated: '2026-01-25',
  },
  'magistral-medium-2509': {
    type: 'chat' as const,
    provider: 'mistral' as const,
    displayName: 'Magistral Medium 1.2',
    description: 'Our frontier-class multimodal reasoning model.',
    benchmarks: {
      intelligence: 18.7,
      coding: 16,
      math: 40.3,
      mmluPro: 0.75,
      gpqa: 0.68,
    },
    performance: {
      intelligenceScore: 18.7,
    },
    context: {
      input: {
        text: true,
        audio: false,
        image: true,
        video: false,
      },
      output: {
        text: true,
        audio: false,
        image: false,
        video: false,
      },
    },
    deprecated: false,
    isAvailable: true,
    lastUpdated: '2026-01-25',
  },
  'magistral-small-2509': {
    type: 'chat' as const,
    provider: 'mistral' as const,
    displayName: 'Magistral Small 1.2',
    description: 'Our small multimodal reasoning model.',
    benchmarks: {
      intelligence: 16.8,
      coding: 11.1,
      math: 41.3,
      mmluPro: 0.75,
      gpqa: 0.64,
    },
    performance: {
      intelligenceScore: 16.8,
    },
    context: {
      input: {
        text: true,
        audio: false,
        image: true,
        video: false,
      },
      output: {
        text: true,
        audio: false,
        image: false,
        video: false,
      },
    },
    deprecated: false,
    isAvailable: true,
    lastUpdated: '2026-01-25',
  },
  'ministral-14b-2512': {
    type: 'chat' as const,
    provider: 'mistral' as const,
    displayName: 'Ministral 3 14B',
    description:
      'A powerful model offering best-in-class text and vision capabilities.',
    benchmarks: {
      intelligence: 16,
      coding: 10.9,
      math: 30,
      mmluPro: 0.69,
      gpqa: 0.57,
    },
    performance: {
      intelligenceScore: 16,
    },
    context: {
      input: {
        text: true,
        audio: false,
        image: true,
        video: false,
      },
      output: {
        text: true,
        audio: false,
        image: false,
        video: false,
      },
    },
    deprecated: false,
    isAvailable: true,
    lastUpdated: '2026-01-25',
  },
  'ministral-3b-2512': {
    type: 'chat' as const,
    provider: 'mistral' as const,
    displayName: 'Ministral 3 3B',
    description:
      'A tiny and efficient model offering best-in-class text and vision capabilities.',
    benchmarks: {
      intelligence: 11.2,
      coding: 4.8,
      math: 22,
      mmluPro: 0.52,
      gpqa: 0.36,
    },
    performance: {
      intelligenceScore: 11.2,
    },
    context: {
      input: {
        text: true,
        audio: false,
        image: true,
        video: false,
      },
      output: {
        text: true,
        audio: false,
        image: false,
        video: false,
      },
    },
    deprecated: false,
    isAvailable: true,
    lastUpdated: '2026-01-25',
  },
  'ministral-8b-2512': {
    type: 'chat' as const,
    provider: 'mistral' as const,
    displayName: 'Ministral 3 8B',
    description:
      'A powerful and efficient model offering best-in-class text and vision capabilities.',
    benchmarks: {
      intelligence: 14.6,
      coding: 10,
      math: 31.7,
      mmluPro: 0.64,
      gpqa: 0.47,
    },
    performance: {
      intelligenceScore: 14.6,
    },
    context: {
      input: {
        text: true,
        audio: false,
        image: true,
        video: false,
      },
      output: {
        text: true,
        audio: false,
        image: false,
        video: false,
      },
    },
    deprecated: false,
    isAvailable: true,
    lastUpdated: '2026-01-25',
  },
  'mistral-embed': {
    type: 'embedding' as const,
    provider: 'mistral' as const,
    displayName: 'Mistral Embed',
    description:
      'Our state-of-the-art semantic for extracting representation of code extracts',
    pricing: { input: 0.1, output: 0 },
    context: {
      input: {
        text: true,
        audio: false,
        image: false,
        video: false,
      },
      output: {
        text: true,
        audio: false,
        image: false,
        video: false,
      },
    },
    deprecated: false,
    isAvailable: true,
    lastUpdated: '2026-01-25',
  },
  'mistral-medium-2508': {
    type: 'chat' as const,
    provider: 'mistral' as const,
    displayName: 'Mistral Medium 3.1',
    description: 'Our frontier-class multimodal model released August 2025.',
    benchmarks: {
      intelligence: 17.6,
      coding: 13.6,
      math: 30.3,
      mmluPro: 0.76,
      gpqa: 0.58,
    },
    performance: {
      intelligenceScore: 17.6,
    },
    context: {
      input: {
        text: true,
        audio: false,
        image: true,
        video: false,
      },
      output: {
        text: true,
        audio: false,
        image: false,
        video: false,
      },
    },
    deprecated: false,
    isAvailable: true,
    lastUpdated: '2026-01-25',
  },
  'mistral-small-2501': {
    type: 'chat' as const,
    provider: 'mistral' as const,
    displayName: 'Mistral Small 3.2',
    description: 'An update to our previous small model, released June 2025.',
    benchmarks: {
      intelligence: 14,
      coding: 13.9,
      math: 3.7,
      mmluPro: 0.66,
      gpqa: 0.45,
    },
    performance: {
      intelligenceScore: 14,
    },
    context: {
      input: {
        text: true,
        audio: false,
        image: false,
        video: false,
      },
      output: {
        text: true,
        audio: false,
        image: false,
        video: false,
      },
    },
    deprecated: false,
    isAvailable: true,
    lastUpdated: '2026-01-25',
  },
  'mistral-small-2506': {
    type: 'chat' as const,
    provider: 'mistral' as const,
    displayName: 'Mistral Small 3.2',
    description: 'An update to our previous small model, released June 2025.',
    benchmarks: {
      intelligence: 24.9,
      coding: 18.3,
      math: 3.7,
      mmluPro: 0.66,
      gpqa: 0.45,
    },
    performance: {
      intelligenceScore: 24.9,
    },
    context: {
      input: {
        text: true,
        audio: false,
        image: false,
        video: false,
      },
      output: {
        text: true,
        audio: false,
        image: false,
        video: false,
      },
    },
    deprecated: false,
    isAvailable: true,
    lastUpdated: '2026-01-25',
  },
  'mistral-tiny-2407': {
    type: 'chat' as const,
    provider: 'mistral' as const,
    displayName: 'Mistral Tiny',
    description: 'Legacy small model from July 2024.',
    context: {
      input: {
        text: true,
        audio: false,
        image: false,
        video: false,
      },
      output: {
        text: true,
        audio: false,
        image: false,
        video: false,
      },
    },
    deprecated: false,
    isAvailable: true,
    lastUpdated: '2026-01-25',
  },
  'open-mistral-nemo-2407': {
    type: 'chat' as const,
    provider: 'mistral' as const,
    displayName: 'Mistral Nemo 12B',
    description: 'Our best multilingual open source model released July 2024.',
    benchmarks: {
      intelligence: 7.4,
      mmluPro: 0.25,
      gpqa: 0.18,
    },
    performance: {
      intelligenceScore: 7.4,
    },
    context: {
      input: {
        text: true,
        audio: false,
        image: false,
        video: false,
      },
      output: {
        text: true,
        audio: false,
        image: false,
        video: false,
      },
    },
    deprecated: false,
    isAvailable: true,
    lastUpdated: '2026-01-25',
  },
  'pixtral-12b-2409': {
    type: 'chat' as const,
    provider: 'mistral' as const,
    displayName: 'Pixtral 12B',
    description: 'Multimodal model with vision capabilities.',
    context: {
      input: {
        text: true,
        audio: false,
        image: true,
        video: false,
      },
      output: {
        text: true,
        audio: false,
        image: false,
        video: false,
      },
    },
    deprecated: false,
    isAvailable: true,
    lastUpdated: '2026-01-25',
  },
  'pixtral-large-2411': {
    type: 'chat' as const,
    provider: 'mistral' as const,
    displayName: 'Pixtral Large',
    description:
      'Our first frontier-class multimodal model released November 2024.',
    benchmarks: {
      intelligence: 14,
      math: 2.3,
      mmluPro: 0.7,
      gpqa: 0.51,
    },
    performance: {
      intelligenceScore: 14,
    },
    context: {
      input: {
        text: true,
        audio: false,
        image: true,
        video: false,
      },
      output: {
        text: true,
        audio: false,
        image: false,
        video: false,
      },
    },
    deprecated: false,
    isAvailable: true,
    lastUpdated: '2026-01-25',
  },
  'voxtral-mini-latest': {
    type: 'chat' as const,
    provider: 'mistral' as const,
    displayName: 'Voxtral Mini',
    description: 'A mini version of our first audio input model.',
    pricing: { input: 0.04, output: 0.04 },
    context: {
      input: {
        text: true,
        audio: true,
        image: false,
        video: false,
      },
      output: {
        text: true,
        audio: false,
        image: false,
        video: false,
      },
    },
    deprecated: false,
    isAvailable: true,
    lastUpdated: '2026-01-25',
  },
  'voxtral-small-2507': {
    type: 'chat' as const,
    provider: 'mistral' as const,
    displayName: 'Voxtral Small',
    description:
      'Our first model with audio input capabilities for instruct use cases.',
    context: {
      input: {
        text: true,
        audio: true,
        image: false,
        video: false,
      },
      output: {
        text: true,
        audio: false,
        image: false,
        video: false,
      },
    },
    deprecated: false,
    isAvailable: true,
    lastUpdated: '2026-01-25',
  },
  'dall-e-3': {
    type: 'image' as const,
    provider: 'openai' as const,
    displayName: 'DALL·E 3',
    description: 'Previous generation image generation model',
    imagePricing: {
      'hd-1024x1024': 0.08,
      'hd-1024x1792': 0.12,
      'hd-1792x1024': 0.12,
      'standard-1024x1024': 0.04,
      'standard-1024x1792': 0.08,
      'standard-1792x1024': 0.08,
    },
    context: {
      input: {
        text: true,
        audio: false,
        image: false,
        video: false,
      },
      output: {
        text: false,
        audio: false,
        image: true,
        video: false,
      },
    },
    deprecated: false,
    isAvailable: true,
    lastUpdated: '2026-01-25',
  },
  'gpt-3.5-turbo': {
    type: 'chat' as const,
    provider: 'openai' as const,
    displayName: 'GPT-3.5 Turbo',
    description: 'Legacy GPT model for cheaper chat and non-chat tasks',
    pricing: { input: 0.5, output: 1.5 },
    contextLength: 16385,
    context: {
      input: {
        text: true,
        audio: false,
        image: false,
        video: false,
      },
      output: {
        text: true,
        audio: false,
        image: false,
        video: false,
      },
    },
    deprecated: false,
    isAvailable: true,
    lastUpdated: '2026-01-25',
  },
  'gpt-3.5-turbo-16k': {
    type: 'chat' as const,
    provider: 'openai' as const,
    displayName: 'GPT-3.5 Turbo',
    description: 'Legacy GPT model for cheaper chat and non-chat tasks',
    pricing: { input: 3, output: 4 },
    contextLength: 16384,
    context: {
      input: {
        text: true,
        audio: false,
        image: false,
        video: false,
      },
      output: {
        text: true,
        audio: false,
        image: false,
        video: false,
      },
    },
    deprecated: false,
    isAvailable: true,
    lastUpdated: '2026-01-25',
  },
  'gpt-4-turbo': {
    type: 'chat' as const,
    provider: 'openai' as const,
    displayName: 'GPT-4 Turbo',
    description: 'An older high-intelligence GPT model',
    pricing: { input: 10, output: 30 },
    benchmarks: {
      intelligence: 12.8,
      coding: 13.1,
    },
    performance: {
      intelligenceScore: 12.8,
    },
    contextLength: 128000,
    context: {
      input: {
        text: true,
        audio: false,
        image: true,
        video: false,
      },
      output: {
        text: true,
        audio: false,
        image: false,
        video: false,
      },
    },
    deprecated: false,
    isAvailable: true,
    lastUpdated: '2026-01-25',
  },
  'gpt-4.1': {
    type: 'chat' as const,
    provider: 'openai' as const,
    displayName: 'GPT-4.1',
    description: 'Smartest non-reasoning model',
    pricing: { input: 2, output: 8 },
    benchmarks: {
      intelligence: 22.4,
      coding: 18.5,
      math: 46.3,
      mmluPro: 0.78,
      gpqa: 0.66,
    },
    performance: {
      intelligenceScore: 22.4,
    },
    contextLength: 128000,
    context: {
      input: {
        text: true,
        audio: false,
        image: true,
        video: false,
      },
      output: {
        text: true,
        audio: false,
        image: false,
        video: false,
      },
    },
    deprecated: false,
    isAvailable: true,
    lastUpdated: '2026-01-25',
  },
  'gpt-4.1-nano-2025-04-14': {
    type: 'chat' as const,
    provider: 'openai' as const,
    displayName: 'GPT-4.1 nano',
    description: 'Fastest, most cost-efficient version of GPT-4.1',
    pricing: { input: 0.1, output: 0.4 },
    benchmarks: {
      intelligence: 12.9,
      coding: 11.2,
      math: 24,
      mmluPro: 0.66,
      gpqa: 0.51,
    },
    performance: {
      intelligenceScore: 12.9,
    },
    contextLength: 128000,
    context: {
      input: {
        text: true,
        audio: false,
        image: true,
        video: false,
      },
      output: {
        text: true,
        audio: false,
        image: false,
        video: false,
      },
    },
    deprecated: false,
    isAvailable: true,
    lastUpdated: '2026-01-25',
  },
  'gpt-4o': {
    type: 'chat' as const,
    provider: 'openai' as const,
    displayName: 'GPT-4o',
    description: 'Fast, intelligent, flexible GPT model',
    pricing: { input: 2.5, output: 10 },
    benchmarks: {
      intelligence: 18.6,
      math: 25.7,
      mmluPro: 0.8,
      gpqa: 0.66,
    },
    performance: {
      intelligenceScore: 18.6,
    },
    contextLength: 128000,
    context: {
      input: {
        text: true,
        audio: false,
        image: true,
        video: false,
      },
      output: {
        text: true,
        audio: false,
        image: false,
        video: false,
      },
    },
    deprecated: false,
    isAvailable: true,
    lastUpdated: '2026-01-25',
  },
  'gpt-4o-audio-preview': {
    type: 'audio' as const,
    provider: 'openai' as const,
    displayName: 'GPT-4o Audio',
    description: 'GPT-4o models capable of audio inputs and outputs',
    pricing: { input: 2.5, output: 10 },
    context: {
      input: {
        text: true,
        audio: true,
        image: false,
        video: false,
      },
      output: {
        text: true,
        audio: true,
        image: false,
        video: false,
      },
    },
    deprecated: false,
    isAvailable: true,
    lastUpdated: '2026-01-25',
  },
  'gpt-4o-mini-audio-preview': {
    type: 'audio' as const,
    provider: 'openai' as const,
    displayName: 'GPT-4o mini Audio',
    description: 'Smaller model capable of audio inputs and outputs',
    pricing: { input: 0.15, output: 0.6 },
    contextLength: 128000,
    context: {
      input: {
        text: true,
        audio: true,
        image: false,
        video: false,
      },
      output: {
        text: true,
        audio: true,
        image: false,
        video: false,
      },
    },
    deprecated: false,
    isAvailable: true,
    lastUpdated: '2026-01-25',
  },
  'gpt-4o-mini-realtime-preview': {
    type: 'audio' as const,
    provider: 'openai' as const,
    displayName: 'GPT-4o mini Realtime',
    description: 'Smaller realtime model for text and audio inputs and outputs',
    pricing: { input: 0.6, output: 2.4 },
    contextLength: 128000,
    context: {
      input: {
        text: true,
        audio: true,
        image: false,
        video: false,
      },
      output: {
        text: true,
        audio: true,
        image: false,
        video: false,
      },
    },
    deprecated: false,
    isAvailable: true,
    lastUpdated: '2026-01-25',
  },
  'gpt-4o-mini-search-preview': {
    type: 'chat' as const,
    provider: 'openai' as const,
    displayName: 'GPT-4o mini Search Preview',
    description: 'Fast, affordable small model for web search',
    pricing: { input: 0.15, output: 0.6 },
    context: {
      input: {
        text: true,
        audio: false,
        image: false,
        video: false,
      },
      output: {
        text: true,
        audio: false,
        image: false,
        video: false,
      },
    },
    deprecated: false,
    isAvailable: true,
    lastUpdated: '2026-01-25',
  },
  'gpt-4o-mini-transcribe': {
    type: 'audio' as const,
    provider: 'openai' as const,
    displayName: 'GPT-4o mini Transcribe',
    description: 'Speech-to-text model powered by GPT-4o mini',
    pricing: { input: 1.25, output: 5 },
    context: {
      input: {
        text: false,
        audio: true,
        image: false,
        video: false,
      },
      output: {
        text: true,
        audio: false,
        image: false,
        video: false,
      },
    },
    deprecated: false,
    isAvailable: true,
    lastUpdated: '2026-01-25',
  },
  'gpt-4o-mini-transcribe-2025-12-15': {
    type: 'audio' as const,
    provider: 'openai' as const,
    displayName: 'GPT-4o mini Transcribe',
    description: 'Speech-to-text model powered by GPT-4o mini',
    pricing: { input: 1.25, output: 5 },
    context: {
      input: {
        text: false,
        audio: true,
        image: false,
        video: false,
      },
      output: {
        text: true,
        audio: false,
        image: false,
        video: false,
      },
    },
    deprecated: false,
    isAvailable: true,
    lastUpdated: '2026-01-25',
  },
  'gpt-4o-mini-tts': {
    type: 'tts' as const,
    provider: 'openai' as const,
    displayName: 'GPT-4o mini TTS',
    description: 'Text-to-speech model powered by GPT-4o mini',
    pricing: { input: 0.6 },
    context: {
      input: {
        text: true,
        audio: false,
        image: false,
        video: false,
      },
      output: {
        text: false,
        audio: true,
        image: false,
        video: false,
      },
    },
    deprecated: false,
    isAvailable: true,
    lastUpdated: '2026-01-25',
  },
  'gpt-4o-mini-tts-2025-03-20': {
    type: 'tts' as const,
    provider: 'openai' as const,
    displayName: 'GPT-4o mini TTS',
    description: 'Text-to-speech model powered by GPT-4o mini',
    pricing: { input: 0.6 },
    context: {
      input: {
        text: true,
        audio: false,
        image: false,
        video: false,
      },
      output: {
        text: false,
        audio: true,
        image: false,
        video: false,
      },
    },
    deprecated: false,
    isAvailable: true,
    lastUpdated: '2026-01-25',
  },
  'gpt-4o-realtime-preview': {
    type: 'audio' as const,
    provider: 'openai' as const,
    displayName: 'GPT-4o Realtime',
    description: 'Model capable of realtime text and audio inputs and outputs',
    pricing: { input: 5, output: 20 },
    contextLength: 128000,
    context: {
      input: {
        text: true,
        audio: true,
        image: false,
        video: false,
      },
      output: {
        text: true,
        audio: true,
        image: false,
        video: false,
      },
    },
    deprecated: false,
    isAvailable: true,
    lastUpdated: '2026-01-25',
  },
  'gpt-4o-realtime-preview-2025-06-03': {
    type: 'audio' as const,
    provider: 'openai' as const,
    displayName: 'GPT-4o Realtime',
    description: 'Model capable of realtime text and audio inputs and outputs',
    pricing: { input: 5, output: 20 },
    contextLength: 128000,
    context: {
      input: {
        text: true,
        audio: true,
        image: false,
        video: false,
      },
      output: {
        text: true,
        audio: true,
        image: false,
        video: false,
      },
    },
    deprecated: false,
    isAvailable: true,
    lastUpdated: '2026-01-25',
  },
  'gpt-4o-search-preview': {
    type: 'chat' as const,
    provider: 'openai' as const,
    displayName: 'GPT-4o Search Preview',
    description: 'GPT model for web search in Chat Completions',
    pricing: { input: 2.5, output: 10 },
    contextLength: 128000,
    context: {
      input: {
        text: true,
        audio: false,
        image: false,
        video: false,
      },
      output: {
        text: true,
        audio: false,
        image: false,
        video: false,
      },
    },
    deprecated: false,
    isAvailable: true,
    lastUpdated: '2026-01-25',
  },
  'gpt-4o-transcribe': {
    type: 'audio' as const,
    provider: 'openai' as const,
    displayName: 'GPT-4o Transcribe',
    description: 'Speech-to-text model powered by GPT-4o',
    pricing: { input: 2.5, output: 10 },
    context: {
      input: {
        text: false,
        audio: true,
        image: false,
        video: false,
      },
      output: {
        text: true,
        audio: false,
        image: false,
        video: false,
      },
    },
    deprecated: false,
    isAvailable: true,
    lastUpdated: '2026-01-25',
  },
  'gpt-4o-transcribe-diarize': {
    type: 'audio' as const,
    provider: 'openai' as const,
    displayName: 'GPT-4o Transcribe Diarize',
    description: "Transcription model that identifies who's speaking when",
    pricing: { input: 2.5, output: 10 },
    context: {
      input: {
        text: false,
        audio: true,
        image: false,
        video: false,
      },
      output: {
        text: true,
        audio: false,
        image: false,
        video: false,
      },
    },
    deprecated: false,
    isAvailable: true,
    lastUpdated: '2026-01-25',
  },
  'gpt-5-mini-2025-08-07': {
    type: 'chat' as const,
    provider: 'openai' as const,
    displayName: 'GPT-5 mini',
    description:
      'A faster, cost-efficient version of GPT-5 for well-defined tasks',
    pricing: { input: 0.25, output: 2 },
    benchmarks: {
      intelligence: 11.9,
    },
    performance: {
      intelligenceScore: 11.9,
    },
    contextLength: 128000,
    context: {
      input: {
        text: true,
        audio: false,
        image: true,
        video: false,
      },
      output: {
        text: true,
        audio: false,
        image: false,
        video: false,
      },
    },
    deprecated: false,
    isAvailable: true,
    lastUpdated: '2026-01-25',
  },
  'gpt-5-nano-2025-08-07': {
    type: 'chat' as const,
    provider: 'openai' as const,
    displayName: 'GPT-5 nano',
    description: 'Fastest, most cost-efficient version of GPT-5',
    pricing: { input: 0.05, output: 0.4 },
    benchmarks: {
      intelligence: 25.7,
      coding: 22.9,
      math: 78.3,
      mmluPro: 0.77,
      gpqa: 0.67,
    },
    performance: {
      intelligenceScore: 25.7,
    },
    contextLength: 128000,
    context: {
      input: {
        text: true,
        audio: false,
        image: true,
        video: false,
      },
      output: {
        text: true,
        audio: false,
        image: false,
        video: false,
      },
    },
    deprecated: false,
    isAvailable: true,
    lastUpdated: '2026-01-25',
  },
  'gpt-5-search-api-2025-10-14': {
    type: 'chat' as const,
    provider: 'openai' as const,
    displayName: 'GPT-5 Search API',
    description: 'GPT-5 model optimized for web search capabilities',
    pricing: { input: 1.25, output: 10 },
    benchmarks: {
      intelligence: 68.5,
      coding: 53.5,
      math: 98.7,
      mmluPro: 0.87,
      gpqa: 0.84,
    },
    performance: {
      intelligenceScore: 68.5,
    },
    contextLength: 128000,
    context: {
      input: {
        text: true,
        audio: false,
        image: false,
        video: false,
      },
      output: {
        text: true,
        audio: false,
        image: false,
        video: false,
      },
    },
    deprecated: false,
    isAvailable: true,
    lastUpdated: '2026-01-25',
  },
  'gpt-5.1-2025-11-13': {
    type: 'chat' as const,
    provider: 'openai' as const,
    displayName: 'GPT-5.1',
    description:
      'The best model for coding and agentic tasks with configurable reasoning effort',
    pricing: { input: 1.25, output: 10 },
    benchmarks: {
      intelligence: 27.4,
      coding: 27.3,
      math: 38,
      mmluPro: 0.8,
      gpqa: 0.64,
    },
    performance: {
      intelligenceScore: 27.4,
    },
    contextLength: 128000,
    context: {
      input: {
        text: true,
        audio: false,
        image: true,
        video: false,
      },
      output: {
        text: true,
        audio: false,
        image: false,
        video: false,
      },
    },
    deprecated: false,
    isAvailable: true,
    lastUpdated: '2026-01-25',
  },
  'gpt-5.2-2025-12-11': {
    type: 'chat' as const,
    provider: 'openai' as const,
    displayName: 'GPT-5.2',
    description:
      'The best model for coding and agentic tasks across industries',
    pricing: { input: 1.75, output: 14 },
    benchmarks: {
      intelligence: 44.5,
      coding: 38.9,
      math: 98.7,
      mmluPro: 0.87,
      gpqa: 0.84,
    },
    performance: {
      intelligenceScore: 44.5,
    },
    contextLength: 200000,
    context: {
      input: {
        text: true,
        audio: false,
        image: true,
        video: false,
      },
      output: {
        text: true,
        audio: false,
        image: false,
        video: false,
      },
    },
    deprecated: false,
    isAvailable: true,
    lastUpdated: '2026-01-25',
  },
  'gpt-audio-mini-2025-10-06': {
    type: 'audio' as const,
    provider: 'openai' as const,
    displayName: 'GPT Audio Mini',
    description: 'A cost-efficient version of GPT Audio',
    pricing: { input: 0.6, output: 2.4 },
    contextLength: 128000,
    context: {
      input: {
        text: true,
        audio: true,
        image: false,
        video: false,
      },
      output: {
        text: true,
        audio: true,
        image: false,
        video: false,
      },
    },
    deprecated: false,
    isAvailable: true,
    lastUpdated: '2026-01-25',
  },
  'gpt-audio-mini-2025-12-15': {
    type: 'audio' as const,
    provider: 'openai' as const,
    displayName: 'gpt-audio-mini',
    description: 'A cost-efficient version of GPT Audio',
    pricing: { input: 0.6, output: 2.4 },
    contextLength: 128000,
    context: {
      input: {
        text: true,
        audio: true,
        image: false,
        video: false,
      },
      output: {
        text: true,
        audio: true,
        image: false,
        video: false,
      },
    },
    deprecated: false,
    isAvailable: true,
    lastUpdated: '2026-01-25',
  },
  'gpt-realtime-2025-08-28': {
    type: 'audio' as const,
    provider: 'openai' as const,
    displayName: 'GPT Realtime',
    description: 'Model capable of realtime text and audio inputs and outputs',
    pricing: { input: 4, output: 16 },
    contextLength: 128000,
    context: {
      input: {
        text: true,
        audio: true,
        image: false,
        video: false,
      },
      output: {
        text: true,
        audio: true,
        image: false,
        video: false,
      },
    },
    deprecated: false,
    isAvailable: true,
    lastUpdated: '2026-01-25',
  },
  'gpt-realtime-mini-2025-12-15': {
    type: 'audio' as const,
    provider: 'openai' as const,
    displayName: 'GPT Realtime Mini',
    description: 'A cost-efficient version of GPT Realtime',
    pricing: { input: 0.6, output: 2.4 },
    contextLength: 128000,
    context: {
      input: {
        text: true,
        audio: true,
        image: false,
        video: false,
      },
      output: {
        text: true,
        audio: true,
        image: false,
        video: false,
      },
    },
    deprecated: false,
    isAvailable: true,
    lastUpdated: '2026-01-25',
  },
  'text-embedding-3-large': {
    type: 'embedding' as const,
    provider: 'openai' as const,
    displayName: 'text-embedding-3-large',
    description: 'Most capable embedding model',
    pricing: { input: 0.13 },
    contextLength: 8191,
    context: {
      input: {
        text: true,
        audio: false,
        image: false,
        video: false,
      },
      output: {
        text: false,
        audio: false,
        image: false,
        video: false,
      },
    },
    deprecated: false,
    isAvailable: true,
    lastUpdated: '2026-01-25',
  },
  'text-embedding-3-small': {
    type: 'embedding' as const,
    provider: 'openai' as const,
    displayName: 'text-embedding-3-small',
    description: 'Small embedding model',
    pricing: { input: 0.02 },
    contextLength: 8191,
    context: {
      input: {
        text: true,
        audio: false,
        image: false,
        video: false,
      },
      output: {
        text: false,
        audio: false,
        image: false,
        video: false,
      },
    },
    deprecated: false,
    isAvailable: true,
    lastUpdated: '2026-01-25',
  },
  'text-embedding-ada-002': {
    type: 'embedding' as const,
    provider: 'openai' as const,
    displayName: 'text-embedding-ada-002',
    description: 'Older embedding model',
    pricing: { input: 0.1 },
    contextLength: 8191,
    context: {
      input: {
        text: true,
        audio: false,
        image: false,
        video: false,
      },
      output: {
        text: false,
        audio: false,
        image: false,
        video: false,
      },
    },
    deprecated: false,
    isAvailable: true,
    lastUpdated: '2026-01-25',
  },
  'tts-1': {
    type: 'tts' as const,
    provider: 'openai' as const,
    displayName: 'TTS-1',
    description: 'Text-to-speech model optimized for speed',
    context: {
      input: {
        text: true,
        audio: false,
        image: false,
        video: false,
      },
      output: {
        text: false,
        audio: true,
        image: false,
        video: false,
      },
    },
    deprecated: false,
    isAvailable: true,
    lastUpdated: '2026-01-25',
  },
  'tts-1-hd': {
    type: 'tts' as const,
    provider: 'openai' as const,
    displayName: 'TTS-1 HD',
    description: 'Text-to-speech model optimized for quality',
    context: {
      input: {
        text: true,
        audio: false,
        image: false,
        video: false,
      },
      output: {
        text: false,
        audio: true,
        image: false,
        video: false,
      },
    },
    deprecated: false,
    isAvailable: true,
    lastUpdated: '2026-01-25',
  },
  'whisper-1': {
    type: 'audio' as const,
    provider: 'openai' as const,
    displayName: 'Whisper',
    description: 'General-purpose speech recognition model',
    context: {
      input: {
        text: false,
        audio: true,
        image: false,
        video: false,
      },
      output: {
        text: true,
        audio: false,
        image: false,
        video: false,
      },
    },
    deprecated: false,
    isAvailable: true,
    lastUpdated: '2026-01-25',
  },
} as const;

export type ModelId = keyof typeof MODEL_REGISTRY;

// Legacy type aliases for backwards compatibility
export type SupportedModel = ModelId;
export type Provider = SupportedProvider;
