import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { getLayerClient } from '../lib/api-client.js';
import { pullGatesToConfig, readLocalConfig } from '../lib/sync.js';
import type { GateConfig } from '@layer-ai/types';

export const pullCommand = new Command('pull')
  .description('Pull gates from remote to layer.config.yaml')
  .option('-f, --file <path>', 'Config file path', 'layer.config.yaml')
  .option('--force', 'Skip confirmation prompts')
  .action(async (options) => {
    try {
      const configPath = options.file;

      // Fetch remote gates
      const layer = await getLayerClient();
      const remoteGates = await layer.gates.list();

      if (remoteGates.length === 0) {
        console.log(chalk.dim('No gates found on remote'));
        process.exit(0);
      }

      // Read local config if exists
      const localGates = readLocalConfig(configPath);

      // Build gate maps by name
      const localGateMap = new Map(localGates.map((g: GateConfig) => [g.name, g]));
      const remoteGateMap = new Map(remoteGates.map((g: GateConfig) => [g.name, g]));

      // Categorize changes
      const toAdd: typeof remoteGates = [];
      const toUpdate: typeof remoteGates = [];
      const toDelete: GateConfig[] = [];

      // Find gates to add or update
      for (const remoteGate of remoteGates) {
        if (localGateMap.has(remoteGate.name)) {
          toUpdate.push(remoteGate);
        } else {
          toAdd.push(remoteGate);
        }
      }

      // Find gates to delete (exist locally but not remotely)
      for (const localGate of localGates) {
        if (!remoteGateMap.has(localGate.name)) {
          toDelete.push(localGate);
        }
      }

      if (toAdd.length > 0) {
        console.log(chalk.green('\nWill add:'));
        toAdd.forEach((g: GateConfig) => console.log(chalk.cyan(`  • ${g.name}`) + chalk.dim(` (${g.model})`)));
      }

      if (toUpdate.length > 0) {
        console.log(chalk.yellow('\nWill update (local overwritten with remote):'));
        toUpdate.forEach((g: GateConfig) => console.log(chalk.cyan(`  • ${g.name}`) + chalk.dim(` (${g.model})`)));
      }

      if (toDelete.length > 0) {
        console.log(chalk.red('\nWill delete (not on remote):'));
        toDelete.forEach((g: GateConfig) => console.log(chalk.cyan(`  • ${g.name}`) + chalk.dim(` (${g.model})`)));
      }

      if (toAdd.length === 0 && toUpdate.length === 0 && toDelete.length === 0) {
        console.log(chalk.green('✓ Local config is already in sync'));
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

      // Pull gates to config file
      await pullGatesToConfig(remoteGates, configPath);

      console.log(chalk.green(`\n✓ Pulled ${remoteGates.length} gate(s) to ${configPath}`));
      if (toUpdate.length > 0 || toDelete.length > 0) {
        console.log(chalk.dim(`  ${toAdd.length} added, ${toUpdate.length} updated, ${toDelete.length} deleted`));
      }
    } catch (error) {
      console.error(chalk.red('✗ Failed to pull gates'));
      console.error(chalk.red(error instanceof Error ? error.message : String(error)));
      process.exit(1);
    }
  });
