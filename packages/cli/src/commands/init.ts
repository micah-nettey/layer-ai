import { Command } from 'commander';
import { writeFileSync, existsSync } from 'fs';
import chalk from 'chalk';

export const initCommand = new Command('init')
  .description('Initialize a new layer.config.yaml file with template')
  .option('-f, --force', 'Overwrite existing config file')
  .action(async (options) => {
    const configPath = 'layer.config.yaml';

    if (existsSync(configPath) && !options.force) {
      console.error(chalk.red('✗ layer.config.yaml already exists'));
      console.log(chalk.dim('Use --force to overwrite'));
      process.exit(1);
    }

    const template = `# Layer AI Configuration File
#
# This file defines "gates" - named configurations for AI model interactions.
# Each gate specifies which model to use and how to configure it.
#
# Learn more: https://docs.uselayer.ai

gates:
  # Example gate configuration
  - name: my-gate
    model: gpt-4o  # Required: Model to use (gpt-4o, gpt-4o-mini, claude-3-5-sonnet-latest, etc.)

    # Optional public fields (work with both self-hosted and Layer-hosted API)
    description: Default gate for general tasks
    systemPrompt: You are a helpful assistant.
    temperature: 0.7  # 0-2, controls randomness
    maxTokens: 1000   # Maximum tokens in response
    # topP: 0.9       # Nucleus sampling (alternative to temperature)
    # routingStrategy: single  # Options: single, fallback, round-robin
    # fallbackModels:  # Models to try if primary fails
    #   - gpt-4o-mini
    # allowOverrides: true  # Allow request-time parameter overrides
    # tags:
    #   - production

    # Internal fields (layer-ai-internal)
    # These features require a Layer account and only work with Layer-hosted API
    # costWeight: 0.4      # Weight for cost optimization (0-1)
    # latencyWeight: 0.3   # Weight for latency optimization (0-1)
    # qualityWeight: 0.3   # Weight for quality optimization (0-1)
    # maxCostPer1kTokens: 0.01  # Maximum cost per 1k tokens
    # maxLatencyMs: 5000   # Maximum acceptable latency in ms

  # Add more gates as needed
  # - name: fast-gate
  #   model: gpt-4o-mini
  #   description: Fast, cost-effective gate
  #   temperature: 0.5
`;

    try {
      writeFileSync(configPath, template, 'utf-8');

      console.log(chalk.green(`✓ Created ${configPath}`));
      console.log(chalk.dim('\nNext steps:'));
      console.log(chalk.dim('1. Edit layer.config.yaml to configure your gates'));
      console.log(chalk.dim('2. Run "layer validate" to check your configuration'));
    } catch (error) {
      console.error(chalk.red('✗ Failed to write config file:'));
      console.error(error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });