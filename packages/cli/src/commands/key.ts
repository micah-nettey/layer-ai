import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { getLayerClient } from '../lib/api-client.js';

export const keyCommand = new Command('key')
  .description('Manage Layer API keys');

keyCommand
  .command('create <name>')
  .description('Create a new API key')
  .action(async (name: string) => {
    try {
      const layer = await getLayerClient();
      const result = await layer.keys.create({ name });

      console.log(chalk.green(`✓ Created API key '${name}'`));
      console.log(chalk.cyan('\nAPI Key (save this - it will not be shown again):'));
      console.log(chalk.yellow(result.key));
      console.log(chalk.dim(`\nKey ID: ${result.id}`));
      console.log(chalk.dim(`Prefix: ${result.keyPrefix}`));
    } catch (error) {
      console.error(chalk.red('✗ Failed to create API key'));
      console.error(chalk.red(error instanceof Error ? error.message : String(error)));
      process.exit(1);
    }
  });

keyCommand
  .command('list')
  .description('List all API keys')
  .action(async () => {
    try {
      const layer = await getLayerClient();
      const keys = await layer.keys.list();

      if (keys.length === 0) {
        console.log(chalk.dim('No API keys found'));
        return;
      }

      console.log(chalk.green(`✓ Found ${keys.length} API key(s):\n`));

      for (const key of keys) {
        const lastUsed = key.lastUsedAt
          ? new Date(key.lastUsedAt).toLocaleDateString()
          : 'Never';

        console.log(chalk.cyan(`  • ${key.name}`) + chalk.dim(` (${key.keyPrefix}...)`));
        console.log(chalk.dim(`    ID: ${key.id}`));
        console.log(chalk.dim(`    Created: ${new Date(key.createdAt).toLocaleDateString()}`));
        console.log(chalk.dim(`    Last used: ${lastUsed}\n`));
      }
    } catch (error) {
      console.error(chalk.red('✗ Failed to list API keys'));
      console.error(chalk.red(error instanceof Error ? error.message : String(error)));
      process.exit(1);
    }
  });

keyCommand
  .command('revoke <id>')
  .description('Revoke an API key')
  .action(async (id: string) => {
    try {
      const { confirm } = await inquirer.prompt([{
        type: 'confirm',
        name: 'confirm',
        message: `Are you sure you want to revoke API key '${id}'?`,
        default: false
      }]);

      if (!confirm) {
        console.log(chalk.dim('Cancelled'));
        return;
      }

      const layer = await getLayerClient();
      await layer.keys.delete(id);
      console.log(chalk.green(`✓ Revoked API key '${id}'`));
    } catch (error) {
      console.error(chalk.red('✗ Failed to revoke API key'));
      console.error(chalk.red(error instanceof Error ? error.message : String(error)));
      process.exit(1);
    }
  });
