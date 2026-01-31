import fs from 'fs/promises';
import type { LayerConfigFile } from '../types/index.js';
import { parseYAML } from './parser.js';
import { validateConfig } from './validator.js';

export async function loadConfig(filePath: string): Promise<LayerConfigFile> {
  let content: string;
  try {
    content = await fs.readFile(filePath, 'utf-8');
  } catch (error) {
    throw new Error(
      `Failed to read config file at ${filePath}: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }

  const parsed = parseYAML(content);

  return validateConfig(parsed);
}

/**
 * Utility: Parse config from string (useful for testing)
 */
export function parseConfig(yamlContent: string): LayerConfigFile {
  const parsed = parseYAML(yamlContent);
  return validateConfig(parsed);
}
