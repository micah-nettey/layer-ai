import { Command } from 'commander';
import chalk from 'chalk';
import { readFileSync, existsSync } from 'fs';
import inquirer from 'inquirer';
import ora from 'ora';
import { getLayerClient } from '../lib/api-client.js';
import { parseYAML, validateConfig } from '@layer-ai/config';
import type { LayerConfigFile, GateConfig } from '@layer-ai/types';

export const pushCommand = new Command('push')
  .description('Push gates from layer.config.yaml to remote')
  .option('-f, --file <path>', 'Config file path', 'layer.config.yaml')
  .option('--force', 'Skip confirmation prompts')
  .action(async (options) => {
    try {
      const configPath = options.file;

      // Check if config file exists
      if (!existsSync(configPath)) {
        console.error(chalk.red(`✗ Config file not found: ${configPath}`));
        console.log(chalk.dim('Run "layer init" to create a config file'));
        process.exit(1);
      }

      // Read and validate local config
      const content = readFileSync(configPath, 'utf-8');
      const parsedConfig = parseYAML(content);
      const config = validateConfig(parsedConfig) as LayerConfigFile;
      const localGates = config.gates;

      if (localGates.length === 0) {
        console.log(chalk.dim('No gates found in config file'));
        process.exit(0);
      }

      // Fetch remote gates
      const layer = await getLayerClient();
      const remoteGates = await layer.gates.list();

      // Build gate maps by name
      const localGateMap = new Map(localGates.map((g: GateConfig) => [g.name, g]));
      const remoteGateMap = new Map(remoteGates.map((g: GateConfig) => [g.name, g]));

      // Categorize changes
      const toCreate: GateConfig[] = [];
      const toUpdate: GateConfig[] = [];
      const toDelete: typeof remoteGates = [];

      // Find gates to create or update
      for (const localGate of localGates) {
        if (remoteGateMap.has(localGate.name)) {
          toUpdate.push(localGate);
        } else {
          toCreate.push(localGate);
        }
      }

      // Find gates to delete (exist remotely but not locally)
      for (const remoteGate of remoteGates) {
        if (!localGateMap.has(remoteGate.name)) {
          toDelete.push(remoteGate);
        }
      }

      // Show summary
      if (toCreate.length > 0) {
        console.log(chalk.green('\nWill create:'));
        toCreate.forEach((g: GateConfig) => console.log(chalk.cyan(`  • ${g.name}`) + chalk.dim(` (${g.model})`)));
      }

      if (toUpdate.length > 0) {
        console.log(chalk.yellow('\nWill update (remote overwritten with local):'));
        toUpdate.forEach((g: GateConfig) => console.log(chalk.cyan(`  • ${g.name}`) + chalk.dim(` (${g.model})`)));
      }

      if (toDelete.length > 0) {
        console.log(chalk.red('\nWill delete (not in local config):'));
        toDelete.forEach((g: GateConfig) => console.log(chalk.cyan(`  • ${g.name}`) + chalk.dim(` (${g.model})`)));
      }

      if (toCreate.length === 0 && toUpdate.length === 0 && toDelete.length === 0) {
        console.log(chalk.green('✓ Remote is already in sync'));
        return;
      }

      // Confirm if not forced
      if (!options.force) {
        const { confirm } = await inquirer.prompt([{
          type: 'confirm',
          name: 'confirm',
          message: 'Apply these changes?',
          default: true
        }]);

        if (!confirm) {
          console.log(chalk.dim('Cancelled'));
          return;
        }
      }

      // Apply changes
      let created = 0;
      let updated = 0;
      let deleted = 0;

      // Create new gates
      for (const gate of toCreate) {
        const spinner = ora(`Creating ${gate.name}...`).start();
        try {
          await layer.gates.create(gate);
          spinner.succeed(chalk.green(`Created ${gate.name}`));
          created++;
        } catch (error) {
          spinner.fail(chalk.red(`Failed to create ${gate.name}`));
          throw error;
        }
      }

      // Update existing gates
      for (const gate of toUpdate) {
        const spinner = ora(`Updating ${gate.name}...`).start();
        try {
          // Extract update fields (exclude name since it's the identifier)
          const { name, ...updateData } = gate;
          await layer.gates.update(name, updateData);
          spinner.succeed(chalk.green(`Updated ${gate.name}`));
          updated++;
        } catch (error) {
          spinner.fail(chalk.red(`Failed to update ${gate.name}`));
          throw error;
        }
      }

      // Delete remote-only gates
      for (const gate of toDelete) {
        const spinner = ora(`Deleting ${gate.name}...`).start();
        try {
          await layer.gates.delete(gate.name);
          spinner.succeed(chalk.green(`Deleted ${gate.name}`));
          deleted++;
        } catch (error) {
          spinner.fail(chalk.red(`Failed to delete ${gate.name}`));
          throw error;
        }
      }

      console.log(chalk.green(`\n✓ Pushed changes to remote`));
      console.log(chalk.dim(`  ${created} created, ${updated} updated, ${deleted} deleted`));
    } catch (error) {
      console.error(chalk.red('\n✗ Failed to push gates'));
      console.error(chalk.red(error instanceof Error ? error.message : String(error)));
      process.exit(1);
    }
  });
