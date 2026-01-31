/**
 * Provider Factory
 *
 * Centralized module for managing and calling provider adapters.
 * Acts as a factory that routes requests to the appropriate provider adapter
 * based on the model's provider type.
 */

import { OpenAIAdapter } from '../services/providers/openai-adapter.js';
import { AnthropicAdapter } from '../services/providers/anthropic-adapter.js';
import { GoogleAdapter } from '../services/providers/google-adapter.js';
import { MistralAdapter } from '../services/providers/mistral-adapter.js';
import type {
  LayerRequest,
  LayerResponse,
  SupportedModel,
} from '@layer-ai/sdk';
import { MODEL_REGISTRY } from '@layer-ai/sdk';
import { PROVIDER, PROVIDERS, type Provider } from './provider-constants.js';

// Re-export for convenience
export { PROVIDER, PROVIDERS, type Provider };

/**
 * Provider adapter registry
 * Maps provider names to their adapter classes
 */
const PROVIDER_ADAPTERS = {
  [PROVIDER.OPENAI]: OpenAIAdapter,
  [PROVIDER.ANTHROPIC]: AnthropicAdapter,
  [PROVIDER.GOOGLE]: GoogleAdapter,
  [PROVIDER.MISTRAL]: MistralAdapter,
} as const;

/**
 * Normalizes a model ID to its full registry format.
 * Supports both full IDs (e.g., "openai/gpt-4") and short IDs (e.g., "gpt-4").
 */
export function normalizeModelId(modelId: string): SupportedModel {
  if (MODEL_REGISTRY[modelId as SupportedModel]) {
    return modelId as SupportedModel;
  }

  const providers: Provider[] = [
    PROVIDER.OPENAI,
    PROVIDER.ANTHROPIC,
    PROVIDER.GOOGLE,
    PROVIDER.MISTRAL,
  ];
  for (const provider of providers) {
    const fullId = `${provider}/${modelId}`;
    if (MODEL_REGISTRY[fullId as SupportedModel]) {
      return fullId as SupportedModel;
    }
  }

  throw new Error(`invalid model ID: "${modelId}" not found in registry`);
}

/**
 * Gets the provider type for a given model
 */
export function getProviderForModel(model: SupportedModel): Provider {
  const modelInfo = MODEL_REGISTRY[model];
  if (!modelInfo) {
    throw new Error(`Model "${model}" not found in registry`);
  }
  return modelInfo.provider as Provider;
}

/**
 * Calls the appropriate provider adapter for the given request.
 * This is the main entry point for executing AI model requests.
 * @param request - The Layer request to execute
 * @param userId - Optional user ID for BYOK key resolution
 */
export async function callAdapter(
  request: LayerRequest,
  userId?: string
): Promise<LayerResponse> {
  const normalizedModel = normalizeModelId(request.model as string);
  const provider = getProviderForModel(normalizedModel);

  const AdapterClass = PROVIDER_ADAPTERS[provider];
  if (!AdapterClass) {
    throw new Error(`No adapter found for provider: ${provider}`);
  }

  const adapter = new AdapterClass();
  return await adapter.call(request, userId);
}
