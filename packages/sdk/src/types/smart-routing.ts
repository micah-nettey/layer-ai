import type { ModelType } from './model-registry.js';

// Internal type (Layer-AI-Internal)
// This feature requires a Layer account and only work with Layer-hosted API
export interface TaskAnalysis {
  taskType: ModelType; // Detected task type (chat, image, audio, etc.)
  primary: string; // Best model for this task type
  alternatives: string[]; // Alternative models of the SAME type
  reasoning: string; // Why these models work for this task
}
