#!/usr/bin/env node

import { Command } from 'commander';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { validateCommand } from './commands/validate.js';
import { initCommand } from './commands/init.js';
import { loginCommand } from './commands/login.js';

// Get package.json for version
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJson = JSON.parse(
  readFileSync(join(__dirname, '../package.json'), 'utf-8')
);

const program = new Command();

program
  .name('layer')
  .description('CLI tool for Layer AI - Manage your AI model gates')
  .version(packageJson.version);

// Register commands
program.addCommand(validateCommand);
program.addCommand(initCommand);
program.addCommand(loginCommand);

program.parse();