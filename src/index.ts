#!/usr/bin/env node

import { Command } from 'commander';
import { createAuthenticateCommand } from './commands/authenticate.js';
import { createConfigCommand } from './commands/config.js';
import { createAccountsCommand } from './commands/accounts.js';
import { setRetryEnabled } from './helpers/fetch.js';

const program = new Command();

program
  .name('public-cli')
  .description('CLI for interacting with Public.com API')
  .version('0.1.0')
  .option('--no-retry', 'Disable automatic retries on server errors')
  .hook('preAction', () => {
    const opts = program.opts();
    if (opts.retry === false) {
      setRetryEnabled(false);
    }
  });

program.addCommand(createAuthenticateCommand());
program.addCommand(createConfigCommand());
program.addCommand(createAccountsCommand());

program.parse(process.argv);
