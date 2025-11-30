import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { loadCLIConfig, saveCLIConfig } from '../lib/cli-config.js';

export const loginCommand = new Command('login')
  .description('Authenticate with Layer AI')
  .option('--api-key <key>', 'API key')
  .option('--url <url>', 'API base URL')
  .option('--profile <name>', 'Profile name')
  .action(async (options) => {
    const apiKey = options.apiKey || undefined;
    const baseUrl = options.url || undefined;
    const profile = options.profile || undefined;

    let finalApiKey = apiKey;
    let finalBaseUrl = baseUrl;
    let finalProfile = profile;

    if (!finalApiKey) {
      const answer = await inquirer.prompt([{
        type: 'password',
        name: 'apiKey',
        message: 'API Key',
        mask: '*'
      }]);
      finalApiKey = answer.apiKey;
    }

    if (!finalBaseUrl) {
      const answer = await inquirer.prompt([{
        type: 'input',
        name: 'baseUrl',
        message: 'Base URL',
        default: 'http://localhost:3001'
      }]);
      finalBaseUrl = answer.baseUrl;
    }

    if (!finalProfile) {
      const answer = await inquirer.prompt([{
        type: 'input',
        name: 'profile',
        message: 'Profile',
        default: 'default'
      }]);
      finalProfile = answer.profile;
    }

    try {
      const config = await loadCLIConfig();
      config.profiles[finalProfile] = {
        apiKey: finalApiKey,
        baseUrl: finalBaseUrl
      }
      config.activeProfile = finalProfile;
      await saveCLIConfig(config);
      console.log(chalk.green(`✓ Saved credentials to profile '${finalProfile}'`));
      console.log(chalk.green(`✓ Set '${finalProfile}' as active profile`));
    } catch (error) {
      console.error(chalk.red('✗ Failed to save credentials'));
      console.error(chalk.red(error instanceof Error ? error.message : String(error)));
      process.exit(1);
    }
  });