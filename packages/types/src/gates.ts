import { OverrideConfig } from "./models";

// Centralized model registry - single source of truth
export const MODEL_REGISTRY = {
  // OpenAI models
  'gpt-4o': {
    provider: 'openai' as const,
    displayName: 'GPT-4o',
    pricing: { input: 0.005, output: 0.015 },
  },
  'gpt-4o-mini': {
    provider: 'openai' as const,
    displayName: 'GPT-4o Mini',
    pricing: { input: 0.00015, output: 0.0006 },
  },

  // Anthropic models (current as of Nov 2025)
  'claude-sonnet-4-5-20250929': {
    provider: 'anthropic' as const,
    displayName: 'Claude Sonnet 4.5',
    pricing: { input: 0.003, output: 0.015 },
  },
  'claude-opus-4-1-20250805': {
    provider: 'anthropic' as const,
    displayName: 'Claude Opus 4.1',
    pricing: { input: 0.015, output: 0.075 },
  },
  'claude-haiku-4-5-20251001': {
    provider: 'anthropic' as const,
    displayName: 'Claude Haiku 4.5',
    pricing: { input: 0.001, output: 0.005 },
  },
  'claude-sonnet-4-20250514': {
    provider: 'anthropic' as const,
    displayName: 'Claude Sonnet 4',
    pricing: { input: 0.003, output: 0.015 },
  },
  'claude-3-7-sonnet-20250219': {
    provider: 'anthropic' as const,
    displayName: 'Claude 3.7 Sonnet',
    pricing: { input: 0.003, output: 0.015 },
  },
  'claude-3-5-haiku-20241022': {
    provider: 'anthropic' as const,
    displayName: 'Claude 3.5 Haiku',
    pricing: { input: 0.0008, output: 0.004 },
  },
  'gemini-2.0-flash': {
    provider: 'google' as const,
    displayName: 'Gemini 2.0 Flash',
    pricing: { input: 0.0001, output: 0.0004 },
  },
  'gemini-2.5-pro': {
    provider: 'google' as const,
    displayName: 'Gemini 2.5 Pro',
    pricing: { input: 0.00125, output: 0.01 },
  },
  'gemini-2.5-flash': {
    provider: 'google' as const,
    displayName: 'Gemini 2.5 Flash',
    pricing: { input: 0.000075, output: 0.0003 },
  },
} as const;

// Derive types from registry
export type SupportedModel = keyof typeof MODEL_REGISTRY;
export type Provider = typeof MODEL_REGISTRY[SupportedModel]['provider'];

// Gate creation request
export interface CreateGateRequest {
  name: string;
  description?: string;
  model: SupportedModel;
  systemPrompt?: string;
  allowOverrides?: boolean | OverrideConfig;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  tags?: string[];
  routingStrategy?: 'single' | 'fallback' | 'round-robin';
  fallbackModels?: SupportedModel[];
}

// Gate update request
export interface UpdateGateRequest {
  description?: string;
  model?: SupportedModel;
  systemPrompt?: string;
  allowOverrides?: boolean | OverrideConfig;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  tags?: string[];
  routingStrategy?: 'single' | 'fallback' | 'round-robin';
  fallbackModels?: SupportedModel[];
}

// Gate with analytics
export interface GateWithAnalytics {
  id: string; 
  userId: string; 
  name: string; 
  model: SupportedModel; 
  createdAt: Date; 
  updatedAt: Date; 
  requestCount: number; 
  totalCost:number; 
  successRate: number; 
}

