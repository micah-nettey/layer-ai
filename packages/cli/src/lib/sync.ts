import { readFileSync, writeFileSync, existsSync } from 'fs';
import { parseYAML } from '@layer-ai/config';
import YAML from 'yaml';
import type { Gate, GateConfig, LayerConfigFile } from '@layer-ai/types';

/**
 * Pull gates from remote and write to config file
 */
export async function pullGatesToConfig(
  remoteGates: Gate[],
  configPath: string = 'layer.config.yaml'
): Promise<void> {
  // Convert remote gates to config format
  const gateConfigs: GateConfig[] = remoteGates.map(gate => {
    const config: GateConfig = {
      name: gate.name,
      model: gate.model,
    };

    if (gate.description) config.description = gate.description;
    if (gate.systemPrompt) config.systemPrompt = gate.systemPrompt;
    if (gate.allowOverrides !== undefined) config.allowOverrides = gate.allowOverrides;
    if (gate.temperature !== undefined) config.temperature = gate.temperature;
    if (gate.maxTokens !== undefined) config.maxTokens = gate.maxTokens;
    if (gate.topP !== undefined) config.topP = gate.topP;
    if (gate.tags && gate.tags.length > 0) config.tags = gate.tags;
    if (gate.routingStrategy) config.routingStrategy = gate.routingStrategy;
    if (gate.fallbackModels && gate.fallbackModels.length > 0) {
      config.fallbackModels = gate.fallbackModels;
    }

    return config;
  });

  // Create config object
  const config = { gates: gateConfigs };

  // Write to YAML file
  const yamlContent = YAML.stringify(config, {
    indent: 2,
    lineWidth: 0,
  });

  writeFileSync(configPath, yamlContent, 'utf-8');
}

/**
 * Read local config file
 */
export function readLocalConfig(configPath: string = 'layer.config.yaml'): GateConfig[] {
  if (!existsSync(configPath)) {
    return [];
  }

  const content = readFileSync(configPath, 'utf-8');
  const config = parseYAML(content) as LayerConfigFile;
  return config.gates || [];
}
