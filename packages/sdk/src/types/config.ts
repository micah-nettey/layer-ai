import type { GateBase } from './models.js';

/**
 * config for a single gate in layer.config.yaml
 * same format we have for what we have in the schema
 */
export type GateConfig = GateBase;

/**
 * the complete layer.config.yaml file structurepad
 */
export interface LayerConfigFile {
  gates: GateConfig[];
}
