#!/usr/bin/env node

import { Command } from 'commander';
import { createAuthenticateCommand } from './commands/authenticate.js';
import { createConfigCommand } from './commands/config.js';
import { createAccountsCommand } from './commands/accounts.js';
import { createPortfolioCommand } from './commands/portfolio.js';
import { createHistoryCommand } from './commands/history.js';
import { createInstrumentsCommand } from './commands/instruments.js';
import { createInstrumentCommand } from './commands/instrument.js';
import { createQuotesCommand } from './commands/quotes.js';
import { createOptionsExpirationsCommand } from './commands/options-expirations.js';
import { createOptionsChainCommand } from './commands/options-chain.js';
import { createOrderPreflightCommand } from './commands/order-preflight.js';
import { createOrderPlaceCommand } from './commands/order-place.js';
import { createOrderCommand } from './commands/order.js';
import { createOrderCancelCommand } from './commands/order-cancel.js';
import { createOptionGreeksCommand } from './commands/option-greeks.js';
import { createCompletionCommand } from './commands/completion.js';
import { setRetryEnabled } from './helpers/fetch.js';
import { checkForUpdates } from './helpers/update-check.js';
import { VERSION } from './version.js';

const program = new Command();

program
  .name('public-cli')
  .description('CLI for interacting with Public.com API')
  .version(VERSION)
  .option('--no-retry', 'Disable automatic retries on server errors')
  .hook('preAction', () => {
    const opts = program.opts();
    if (opts.retry === false) {
      setRetryEnabled(false);
    }
  })
  .hook('postAction', async () => {
    await checkForUpdates();
  });

program.addCommand(createAuthenticateCommand());
program.addCommand(createConfigCommand());
program.addCommand(createAccountsCommand());
program.addCommand(createPortfolioCommand());
program.addCommand(createHistoryCommand());
program.addCommand(createInstrumentsCommand());
program.addCommand(createInstrumentCommand());
program.addCommand(createQuotesCommand());
program.addCommand(createOptionsExpirationsCommand());
program.addCommand(createOptionsChainCommand());
program.addCommand(createOrderPreflightCommand());
program.addCommand(createOrderPlaceCommand());
program.addCommand(createOrderCommand());
program.addCommand(createOrderCancelCommand());
program.addCommand(createOptionGreeksCommand());
program.addCommand(createCompletionCommand());

program.parse(process.argv);
