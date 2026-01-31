import { Command } from 'commander';
import {
  getAccounts,
  ApiError,
  AuthenticationError,
  RateLimitError,
} from '../helpers/api.js';
import { success, error, info } from '../helpers/output.js';

export function createAccountsCommand(): Command {
  const accounts = new Command('accounts')
    .description('List your trading accounts')
    .action(async () => {
      try {
        const { accounts } = await getAccounts();

        if (accounts.length === 0) {
          info('No accounts found.');
          return;
        }

        success(
          `Found ${accounts.length} account${accounts.length > 1 ? 's' : ''}:\n`
        );

        for (const account of accounts) {
          console.log(`  Account ID:        ${account.accountId}`);
          console.log(`  Account Type:      ${account.accountType}`);
          console.log(`  Brokerage Type:    ${account.brokerageAccountType}`);
          console.log(`  Options Level:     ${account.optionsLevel}`);
          console.log(`  Trade Permissions: ${account.tradePermissions}`);
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
