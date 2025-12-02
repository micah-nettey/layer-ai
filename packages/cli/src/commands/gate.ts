import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { getLayerClient } from '../lib/api-client.js';
import { pullGatesToConfig } from '../lib/sync.js';
import { MODEL_REGISTRY } from '@layer-ai/types';

export const gateCommand = new Command('gate')
  .description('Manage Layer gates');

gateCommand
  .command('get <name>')
  .description('Get gate by name')
  .action(async (name: string) => {
    try {
      const layer = await getLayerClient();
      const gate = await layer.gates.get(name);

      console.log(chalk.green(`✓ Gate: ${gate.name}`));
      console.log(chalk.green(`Model: ${gate.model}`));
      if (gate.description) {
        console.log(chalk.green(`Description: ${gate.description}`));
      }
    } catch (error) {
      console.error(chalk.red('✗ Failed to get gate'));
      console.error(chalk.red(error instanceof Error ? error.message : String(error)));
      process.exit(1);
    }
  });

gateCommand
  .command('list')
  .description('List all gates for this user')
  .action(async () => {
    try {
      const layer = await getLayerClient();
      const gateList = await layer.gates.list();

      if (gateList.length === 0) {
        console.log(chalk.dim('No gates found'));
        return;
      }

      console.log(chalk.green(`✓ Found ${gateList.length} gate(s):\n`));

      for (let gate of gateList) {
        console.log(chalk.cyan(`  • ${gate.name}`) + chalk.dim(` (${gate.model})`));
      }
    } catch (error) {
      console.error(chalk.red('✗ Failed to list gates'));
      console.error(chalk.red(error instanceof Error ? error.message : String(error)));
      process.exit(1);
    }
  });

gateCommand
  .command('delete <name>')
  .description('Delete a gate')
  .action(async (name: string) => {
    try {
      const { confirm } = await inquirer.prompt([{
        type: 'confirm',
        name: 'confirm',
        message: `Are you sure you want to delete '${name}'?`,
        default: false
      }]);

      if (!confirm) {
        console.log(chalk.dim('Cancelled'));
        return;
      }

      const layer = await getLayerClient();
      await layer.gates.delete(name);
      console.log(chalk.green(`✓ Deleted gate '${name}'`));
    } catch (error) {
      console.error(chalk.red('✗ Failed to delete gate'));
      console.error(chalk.red(error instanceof Error ? error.message : String(error)));
      process.exit(1);
    }
  });

gateCommand
  .command('suggestions <name>')
  .description('get ai model recommendations for this gate')
  .action(async (name: string) => {
    try {
      const layer = await getLayerClient();
      const suggestions = await layer.gates.suggestions(name);

      console.log(chalk.cyan(`Analyzing gate '${name}'...\n`));

      console.log(chalk.green('Recommended routing strategy: fallback'));
      console.log(chalk.green('Recommended fallback models:'));
      suggestions.alternatives.forEach((model: string, index: number) => {
        console.log(chalk.cyan(`  ${index + 1}. ${model}`));
      });

      console.log(chalk.dim(`\nReasoning: ${suggestions.reasoning}`));
    } catch (error) {
      console.error(chalk.red('✗ Failed to get gate suggestions'));
      console.error(chalk.red(error instanceof Error ? error.message : String(error)));
      process.exit(1);
    }
  });

gateCommand
  .command('create')
  .description('Create a new gate interactively')
  .action(async () => {
    try {
      const modelChoices = Object.keys(MODEL_REGISTRY);

      // Prompt for required and optional fields
      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'name',
          message: 'Gate name:',
          validate: (input) => input.length > 0 || 'Gate name cannot be empty'
        },
        {
          type: 'list',
          name: 'model',
          message: 'Select a model:',
          choices: modelChoices,
          default: 'gpt-4o'
        },
        {
          type: 'input',
          name: 'description',
          message: 'Description (optional):'
        },
        {
          type: 'input',
          name: 'systemPrompt',
          message: 'System prompt (optional):'
        },
        {
          type: 'input',
          name: 'temperature',
          message: 'Temperature 0-2 (optional):',
          validate: (input: string) => {
            if (!input || input.trim() === '') return true;
            const num = parseFloat(input);
            return (!isNaN(num) && num >= 0 && num <= 2) || 'Must be a number between 0 and 2';
          },
          filter: (input: string) => {
            if (!input || input.trim() === '') return undefined;
            return parseFloat(input);
          }
        }
      ]);

      // Build gate config
      const gateConfig: any = {
        name: answers.name,
        model: answers.model
      };

      if (answers.description) gateConfig.description = answers.description;
      if (answers.systemPrompt) gateConfig.systemPrompt = answers.systemPrompt;
      if (typeof answers.temperature === 'number' && !isNaN(answers.temperature)) {
        gateConfig.temperature = answers.temperature;
      }

      // Create gate via API
      const layer = await getLayerClient();
      await layer.gates.create(gateConfig);

      console.log(chalk.green(`✓ Created gate '${answers.name}'`));

      // Ask if user wants to pull to config file
      const { shouldPull } = await inquirer.prompt([{
        type: 'confirm',
        name: 'shouldPull',
        message: 'Add this gate to layer.config.yaml?',
        default: true
      }]);

      if (shouldPull) {
        const remoteGates = await layer.gates.list();
        await pullGatesToConfig(remoteGates);
        console.log(chalk.green('✓ Updated layer.config.yaml'));
      }
    } catch (error) {
      console.error(chalk.red('✗ Failed to create gate'));
      console.error(chalk.red(error instanceof Error ? error.message : String(error)));
      process.exit(1);
    }
  });

gateCommand
  .command('update <name>')
  .description('Update an existing gate')
  .option('--model <model>', 'Update model')
  .option('--description <desc>', 'Update description')
  .option('--temperature <temp>', 'Update temperature (0-2)', parseFloat)
  .option('--system-prompt <prompt>', 'Update system prompt')
  .action(async (name: string, options: any) => {
    try {
      const updates: any = {};

      if (options.model) updates.model = options.model;
      if (options.description) updates.description = options.description;
      if (options.systemPrompt) updates.systemPrompt = options.systemPrompt;
      if (typeof options.temperature === 'number') {
        if (options.temperature < 0 || options.temperature > 2) {
          console.error(chalk.red('✗ Temperature must be between 0 and 2'));
          process.exit(1);
        }
        updates.temperature = options.temperature;
      }

      if (Object.keys(updates).length === 0) {
        console.error(chalk.red('✗ No update options provided'));
        console.log(chalk.dim('Use --model, --description, --temperature, or --system-prompt'));
        process.exit(1);
      }

      const layer = await getLayerClient();
      await layer.gates.update(name, updates);

      console.log(chalk.green(`✓ Updated gate '${name}'`));

      const { shouldPull } = await inquirer.prompt([{
        type: 'confirm',
        name: 'shouldPull',
        message: 'Update this gate in layer.config.yaml?',
        default: true
      }]);

      if (shouldPull) {
        const remoteGates = await layer.gates.list();
        await pullGatesToConfig(remoteGates);
        console.log(chalk.green('✓ Updated layer.config.yaml'));
      }
    } catch (error) {
      console.error(chalk.red('✗ Failed to update gate'));
      console.error(chalk.red(error instanceof Error ? error.message : String(error)));
      process.exit(1);
    }
  });

