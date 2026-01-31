import { Command } from 'commander';
import { loadConfig } from '@layer-ai/sdk/config';
import chalk from 'chalk';
import { existsSync } from 'fs';
import { resolve } from 'path';

export const validateCommand = new Command('validate')
  .description('Validate layer.config.yaml file')
  .option('-f, --file <path>', 'Path to config file', 'layer.config.yaml')
  .action(async (options) => {
    const configPath = resolve(options.file);

    if (!existsSync(configPath)) {
      console.error(chalk.red(`✗ Config file not found: ${configPath}`));
      process.exit(1);
    }

    try {
      const config = await loadConfig(configPath);

      console.log(chalk.green(`✓ Config file is valid!`));
      console.log(chalk.dim(`\nFound ${config.gates.length} gate(s):`));

      config.gates.forEach((gate, index) => {
        console.log(
          chalk.cyan(`  ${index + 1}. ${gate.name}`) +
            chalk.dim(` (${gate.model})`)
        );
      });
    } catch (error) {
      console.error(chalk.red('✗ Config validation failed:'));
      console.error(
        chalk.red(error instanceof Error ? error.message : String(error))
      );
      process.exit(1);
    }
  });
