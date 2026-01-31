#!/usr/bin/env tsx
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface ModelEntry {
  type: string;
  provider: string;
  displayName: string;
  description?: string;
  pricing?: {
    input?: number;
    output?: number;
  };
  imagePricing?: Record<string, number> | number;
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
  contextLength?: number;
  maxTokens?: number;
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
  deprecated?: boolean;
  deprecationDate?: string;
  shutdownDate?: string;
  replacementModel?: string;
  isAvailable?: boolean;
  lastUpdated?: string;
}

interface RegistryResponse {
  version: string;
  generatedAt: string;
  models: {
    [modelId: string]: ModelEntry;
  };
  metadata: {
    totalModels: number;
    lastSync: string;
  };
}

// Helper function to format an object as TypeScript literal (not JSON)
function formatObjectLiteral(
  obj: any,
  indent: string = '    ',
  depth: number = 0
): string {
  if (obj === null || obj === undefined) {
    return 'undefined';
  }

  if (typeof obj === 'boolean' || typeof obj === 'number') {
    return String(obj);
  }

  if (typeof obj === 'string') {
    return `'${obj}'`;
  }

  if (Array.isArray(obj)) {
    if (obj.length === 0) return '[]';
    const items = obj
      .map((item) => formatObjectLiteral(item, indent, depth + 1))
      .join(', ');
    return `[${items}]`;
  }

  if (typeof obj === 'object') {
    const keys = Object.keys(obj);
    if (keys.length === 0) return '{}';

    const currentIndent = indent.repeat(depth);
    const nextIndent = indent.repeat(depth + 1);

    const props = keys
      .map((key) => {
        const value = formatObjectLiteral(obj[key], indent, depth + 1);
        return `${nextIndent}${key}: ${value}`;
      })
      .join(',\n');

    return `{\n${props}\n${currentIndent}}`;
  }

  return String(obj);
}

function formatModelEntry(model: ModelEntry, indent: string = '    '): string {
  const lines: string[] = [];

  // Helper to escape single quotes in strings
  const escapeString = (str: string) => str.replace(/'/g, "\\'");

  lines.push(`${indent}type: '${model.type}' as const,`);
  lines.push(`${indent}provider: '${model.provider}' as const,`);
  lines.push(`${indent}displayName: '${escapeString(model.displayName)}',`);

  if (model.description) {
    lines.push(`${indent}description: '${escapeString(model.description)}',`);
  }

  if (model.pricing) {
    lines.push(
      `${indent}pricing: { ${model.pricing.input !== undefined ? `input: ${model.pricing.input}` : ''}${model.pricing.input !== undefined && model.pricing.output !== undefined ? ', ' : ''}${model.pricing.output !== undefined ? `output: ${model.pricing.output}` : ''} },`
    );
  }

  if (model.imagePricing !== undefined) {
    if (typeof model.imagePricing === 'number') {
      // Flat rate pricing
      lines.push(`${indent}imagePricing: ${model.imagePricing},`);
    } else {
      // Structured pricing per size/quality
      const pricingParts = Object.entries(model.imagePricing)
        .map(([key, value]) => `'${key}': ${value}`)
        .join(', ');
      lines.push(`${indent}imagePricing: { ${pricingParts} },`);
    }
  }

  if (model.benchmarks) {
    const benchmarkParts: string[] = [];
    if (model.benchmarks.intelligence !== undefined)
      benchmarkParts.push(`intelligence: ${model.benchmarks.intelligence}`);
    if (model.benchmarks.coding !== undefined)
      benchmarkParts.push(`coding: ${model.benchmarks.coding}`);
    if (model.benchmarks.math !== undefined)
      benchmarkParts.push(`math: ${model.benchmarks.math}`);
    if (model.benchmarks.mmluPro !== undefined)
      benchmarkParts.push(`mmluPro: ${model.benchmarks.mmluPro}`);
    if (model.benchmarks.gpqa !== undefined)
      benchmarkParts.push(`gpqa: ${model.benchmarks.gpqa}`);

    if (benchmarkParts.length > 0) {
      lines.push(`${indent}benchmarks: {`);
      benchmarkParts.forEach((part) => {
        lines.push(`${indent}  ${part},`);
      });
      lines.push(`${indent}},`);
    }
  }

  if (model.performance) {
    const perfParts: string[] = [];
    if (model.performance.outputTokenPerSecond !== undefined)
      perfParts.push(
        `outputTokenPerSecond: ${model.performance.outputTokenPerSecond}`
      );
    if (model.performance.timeTofirstToken !== undefined)
      perfParts.push(`timeTofirstToken: ${model.performance.timeTofirstToken}`);
    if (model.performance.intelligenceScore !== undefined)
      perfParts.push(
        `intelligenceScore: ${model.performance.intelligenceScore}`
      );

    if (perfParts.length > 0) {
      lines.push(`${indent}performance: {`);
      perfParts.forEach((part) => {
        lines.push(`${indent}  ${part},`);
      });
      lines.push(`${indent}},`);
    }
  }

  if (model.contextLength !== undefined) {
    lines.push(`${indent}contextLength: ${model.contextLength},`);
  }

  if (model.context) {
    const contextLiteral = formatObjectLiteral(model.context, '  ', 0);
    const formattedContext = contextLiteral
      .split('\n')
      .map((line, i) => (i === 0 ? line : `${indent}${line}`))
      .join('\n');
    lines.push(`${indent}context: ${formattedContext},`);
  }

  if (model.deprecated !== undefined) {
    lines.push(`${indent}deprecated: ${model.deprecated},`);
  }

  if (model.isAvailable !== undefined) {
    lines.push(`${indent}isAvailable: ${model.isAvailable},`);
  }

  if (model.lastUpdated) {
    lines.push(`${indent}lastUpdated: '${model.lastUpdated}',`);
  }

  return lines.join('\n');
}

function generateTypeScriptFile(data: RegistryResponse): string {
  const modelsEntries = Object.entries(data.models)
    .map(([id, model]) => {
      return `  '${id}': {\n${formatModelEntry(model)}\n  }`;
    })
    .join(',\n');

  return `// AUTO-GENERATED FILE - DO NOT EDIT MANUALLY
// Generated at: ${new Date().toISOString()}
// Source: Internal Model Registry API
// To update: Run \`pnpm sync:registry\`
//
// Registry version: ${data.version}
// Last sync: ${data.metadata.lastSync}
// Total models: ${data.metadata.totalModels}

// Providers we support with adapters
export const SUPPORTED_PROVIDERS = ['openai', 'anthropic', 'google', 'mistral'] as const;
export type SupportedProvider = typeof SUPPORTED_PROVIDERS[number];

export type ModelType =
  | 'chat'           // Chat/completion models (GPT-4, Claude, Gemini)
  | 'image'          // Image generation (DALL-E, Stable Diffusion)
  | 'video'          // Video generation
  | 'audio'          // Audio generation (music, sound effects)
  | 'tts'            // Text-to-speech
  | 'stt'            // Speech-to-text (Whisper)
  | 'embeddings'     // Text embeddings
  | 'document'       // Document processing (OCR)
  | 'responses'      // Reasoning models (o3-pro)
  | 'language-completion';  // Legacy completion API

// Base interface for all models
interface BaseModelEntry {
  type: ModelType;
  provider: string;
  displayName: string;
  description?: string;
  pricing?: {
    input?: number;   // Cost per 1K input tokens/units
    output?: number;  // Cost per 1K output tokens/units
  };
  deprecated?: boolean;           // Model is deprecated, prevent new usage
  deprecationDate?: string;       // When the model was/will be deprecated
  shutdownDate?: string;          // When the model will be shut down
  replacementModel?: string;      // Suggested replacement model ID
  isAvailable?: boolean;          // Available for use (NOT deprecated AND accessible via API)
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
  imagePricing?: number | Record<string, number>;  // Flat rate or per-size/quality pricing
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
${modelsEntries}
} as const;

export type ModelId = keyof typeof MODEL_REGISTRY;

// Legacy type aliases for backwards compatibility
export type SupportedModel = ModelId;
export type Provider = SupportedProvider;
`;
}

async function syncRegistry() {
  console.log('🔄 Fetching latest model registry from internal API...\n');

  const internalApiUrl = process.env.INTERNAL_API_URL;
  const internalApiKey = process.env.INTERNAL_API_KEY;

  if (!internalApiUrl) {
    throw new Error('INTERNAL_API_URL environment variable is required');
  }

  if (!internalApiKey) {
    throw new Error('INTERNAL_API_KEY environment variable is required');
  }

  try {
    // 1. Fetch from internal API
    const response = await fetch(
      `${internalApiUrl}/api/model-registry/latest`,
      {
        headers: {
          Authorization: `Bearer ${internalApiKey}`,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error (${response.status}): ${errorText}`);
    }

    const data = (await response.json()) as RegistryResponse;

    console.log(`✅ Fetched ${data.metadata.totalModels} models`);
    console.log(`📅 Registry version: ${data.version}`);
    console.log(`🕐 Last sync: ${data.metadata.lastSync}\n`);

    // 2. Generate TypeScript file
    const tsContent = generateTypeScriptFile(data);

    // 3. Write to file
    const filePath = path.join(
      __dirname,
      '../packages/sdk/src/types/model-registry.ts'
    );
    fs.writeFileSync(filePath, tsContent, 'utf-8');

    console.log('✅ Updated model-registry.ts\n');
    console.log('📋 Next steps:');
    console.log(
      '  1. Review: git diff packages/sdk/src/types/model-registry.ts'
    );
    console.log('  2. Build: pnpm build');
    console.log('  3. Commit: git commit -m "chore: update model registry"');
    console.log(
      '  4. Release: Consider SDK version bump if significant changes\n'
    );
  } catch (error) {
    console.error('❌ Error syncing registry:');
    console.error(error);
    process.exit(1);
  }
}

// Run the sync
syncRegistry();
