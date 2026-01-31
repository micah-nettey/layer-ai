import YAML from 'yaml';

/**
 * Parse YAML string into jscript object
 */
export function parseYAML(content: string): unknown {
  try {
    return YAML.parse(content);
  } catch (error) {
    throw new Error(
      `Failed to parse YAML: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
