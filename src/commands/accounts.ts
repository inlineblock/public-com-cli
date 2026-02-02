import { Command } from 'commander';
import {
  getAccounts,
  ApiError,
  AuthenticationError,
  RateLimitError,
} from '../helpers/api.js';
import {
  success,
  error,
  info,
  row,
  bold,
  dim,
  isJsonMode,
  outputJson,
} from '../helpers/output.js';

export function createAccountsCommand(): Command {
  const accounts = new Command('accounts')
    .description('List your trading accounts')
    .action(async () => {
      try {
        const { accounts } = await getAccounts();

        if (isJsonMode()) {
          outputJson(accounts);
          return;
        }

        if (accounts.length === 0) {
          info('No accounts found.');
          return;
        }

        success(
          `Found ${accounts.length} account${accounts.length > 1 ? 's' : ''}`
        );
        console.log();

        for (const account of accounts) {
          console.log(
            `  ${bold(account.accountId)} ${dim(`(${account.accountType})`)}`
          );
          row('Brokerage Type:   ', account.brokerageAccountType, 4);
          row('Options Level:    ', account.optionsLevel, 4);
          row('Trade Permissions:', account.tradePermissions, 4);
          console.log();
        }
      } catch (err) {
        if (err instanceof AuthenticationError) {
          error(err.message);
        } else if (err instanceof RateLimitError) {
          error('Too many requests. Please try again later.');
        } else if (err instanceof ApiError) {
          error(`Failed to fetch accounts: ${err.message}`);
        } else {
          error(
            `Failed to fetch accounts: ${err instanceof Error ? err.message : 'Unknown error'}`
          );
        }
        process.exit(1);
      }
    });

  return accounts;
}
