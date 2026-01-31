import { OverrideConfig, type GateBase } from './models.js';
import {
  MODEL_REGISTRY,
  type SupportedModel,
  type Provider,
} from './model-registry.js';

// Re-export for backwards compatibility
export { MODEL_REGISTRY };
export type { SupportedModel, Provider };

/**
 * Gate creation request
 * Uses all fields from GateBase (name and model required, rest optional)
 */
export type CreateGateRequest = GateBase;

/**
 * Gate update request
 * All fields optional for partial updates (except can't change name)
 */
export type UpdateGateRequest = Partial<GateBase>;

// Gate with analytics
export interface GateWithAnalytics {
  id: string;
  userId: string;
  name: string;
  model: SupportedModel;
  createdAt: Date;
  updatedAt: Date;
  requestCount: number;
  totalCost: number;
  successRate: number;
}
