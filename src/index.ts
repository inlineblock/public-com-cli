#!/usr/bin/env node

import { Command } from 'commander';
import { createAuthenticateCommand } from './commands/authenticate.js';

const program = new Command();

program
  .name('public-cli')
  .description('CLI for interacting with Public.com API')
  .version('0.1.0');

program.addCommand(createAuthenticateCommand());

program.parse(process.argv);
