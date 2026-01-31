import type { SupportedModel } from './gates.js';
import type { TaskAnalysis } from './smart-routing.js';
import type { ModelType } from './model-registry.js';

export const ANALYSIS_METHODS = [
  'cost',
  'balanced',
  'performance',
  'custom',
] as const;
export type AnalysisMethod = (typeof ANALYSIS_METHODS)[number];

export const ROUTING_STRATEGIES = [
  'single',
  'fallback',
  'round-robin',
] as const;
export type RoutingStrategy = (typeof ROUTING_STRATEGIES)[number];

export const REANALYSIS_PERIODS = [
  'daily',
  'weekly',
  'monthly',
  'never',
] as const;
export type ReanalysisPeriod = (typeof REANALYSIS_PERIODS)[number];

export const APPLIED_BY_VALUES = ['user', 'auto'] as const;
export type AppliedBy = (typeof APPLIED_BY_VALUES)[number];

export const ACTIVITY_ACTIONS = [
  'manual_update',
  'auto_update',
  'reanalysis',
  'rollback',
] as const;
export type ActivityAction = (typeof ACTIVITY_ACTIONS)[number];

// Complete snapshot of gate configuration for rollback
export interface GateHistory {
  id: string;
  gateId: string;
  name: string;
  description: string;
  model: SupportedModel;
  fallbackModels: SupportedModel[];
  routingStrategy?: RoutingStrategy;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  costWeight: number;
  latencyWeight: number;
  qualityWeight: number;
  analysisMethod: AnalysisMethod;
  taskType?: ModelType;
  taskAnalysis?: TaskAnalysis;
  systemPrompt?: string;
  reanalysisPeriod: ReanalysisPeriod;
  autoApplyRecommendations: boolean;
  appliedBy: AppliedBy;
  appliedAt: Date;
  changedFields?: string[];
  createdAt: Date;
}

// Activity log for audit trail
export interface ActivityLog {
  id: string;
  gateId: string;
  userId: string | null;
  userEmail?: string | null;
  action: ActivityAction;
  details: {
    historyId?: string;
    changedFields?: string[];
    reasoning?: string;
    previousModel?: string;
    newModel?: string;
    [key: string]: any;
  };
  timestamp: Date;
}

export interface RollbackGateRequest {
  historyId: string;
}
