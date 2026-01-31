import type { SupportedModel } from './gates.js';
import { TaskAnalysis } from './smart-routing.js';
import type { ModelType } from './model-registry.js';
import type {
  AnalysisMethod,
  RoutingStrategy,
  ReanalysisPeriod,
} from './history.js';

// User
export interface User {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
}

// API Key
export interface ApiKey {
  id: string;
  userId: string;
  keyHash: string;
  keyPrefix: string;
  name: string;
  isActive: boolean;
  lastUsedAt: Date | null;
  createdAt: Date;
}

// Gate
export interface GateBase {
  // Required fields
  name: string;
  model: SupportedModel;
  taskType: ModelType; // Required: determines what kind of task this gate handles

  // Optional public fields
  description?: string;
  systemPrompt?: string;
  allowOverrides?: boolean | OverrideConfig;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  tags?: string[];
  routingStrategy?: RoutingStrategy;
  fallbackModels?: SupportedModel[];
  costWeight?: number;
  latencyWeight?: number;
  qualityWeight?: number;
  analysisMethod?: AnalysisMethod;
  maxCostPer1kTokens?: number;
  maxLatencyMs?: number;
  taskAnalysis?: TaskAnalysis;
  reanalysisPeriod?: ReanalysisPeriod;
  autoApplyRecommendations?: boolean;
}

export interface Gate extends GateBase {
  id: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface OverrideConfig {
  model?: boolean;
  temperature?: boolean;
  maxTokens?: boolean;
  topP?: boolean;
}

export enum OverrideField {
  Model = 'model',
  Temperature = 'temperature',
  MaxTokens = 'maxTokens',
  TopP = 'topP',
}

// Request log
export interface Request {
  id: string;
  userId: string;
  gateId: string | null;
  gateName: string | null;
  modelRequested: string;
  modelUsed: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  costUsd: number;
  latencyMs: number;
  success: boolean;
  errorMessage: string | null;
  createdAt: Date;
  userAgent?: string;
  ipAddress?: string;
  duration?: number;
}
