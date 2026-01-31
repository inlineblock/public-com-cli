import { Command } from 'commander';
import {
  storeApiKey,
  deleteApiKey,
  hasApiKey,
} from '../authentication/keychain.js';
import { success, error, info } from '../helpers/output.js';
import { isValidApiKey } from '../helpers/validation.js';
import {
  validateApiKey,
  clearTokens,
  getAccounts,
  ApiError,
  AuthenticationError,
  RateLimitError,
} from '../helpers/api.js';

export function createAuthenticateCommand(): Command {
  const auth = new Command('auth').description(
    'Manage authentication with Public.com API'
  );

  auth
    .command('login')
    .description('Authenticate with your Public.com API key')
    .requiredOption('-k, --key <apiKey>', 'Your Public.com API key')
    .action(async (options: { key: string }) => {
      try {
        const apiKey = options.key.trim();

        if (!isValidApiKey(apiKey)) {
          error(
            'Invalid API key format. API key must be at least 16 characters.'
          );
          process.exit(1);
        }

        info('Validating API key...');

        await validateApiKey(apiKey);
        await storeApiKey(apiKey);

        success('Authenticated successfully. API key stored securely.');
      } catch (err) {
        if (err instanceof AuthenticationError) {
          error(`Authentication failed: ${err.message}`);
        } else if (err instanceof RateLimitError) {
          error('Too many requests. Please try again later.');
        } else if (err instanceof ApiError) {
          error(`API error: ${err.message}`);
        } else {
          error(
            `Failed to authenticate: ${err instanceof Error ? err.message : 'Unknown error'}`
          );
        }
        process.exit(1);
      }
    });

  auth
    .command('logout')
    .description('Remove stored credentials from system keychain')
    .action(async () => {
      try {
        const hadKey = await hasApiKey();

        await Promise.all([deleteApiKey(), clearTokens()]);

        if (hadKey) {
          success('Logged out successfully. Credentials removed.');
        } else {
          info('No credentials were stored.');
        }
      } catch (err) {
        error(
          `Failed to logout: ${err instanceof Error ? err.message : 'Unknown error'}`
        );
        process.exit(1);
      }
    });

  auth
    .command('status')
    .description('Check authentication status and display account info')
    .action(async () => {
      try {
        const hasKey = await hasApiKey();

        if (!hasKey) {
          info(
            'Not authenticated. Run "public-cli auth login -k <key>" to authenticate.'
          );
          process.exit(0);
        }

        info('Fetching account information...');

        const { accounts } = await getAccounts();

        success('Authenticated\n');

        if (accounts.length === 0) {
          info('No accounts found.');
          return;
        }

        console.log('Accounts:');
        for (const account of accounts) {
          console.log(`\n  Account ID:       ${account.accountId}`);
          console.log(`  Account Type:     ${account.accountType}`);
          console.log(`  Brokerage Type:   ${account.brokerageAccountType}`);
          console.log(`  Options Level:    ${account.optionsLevel}`);
          console.log(`  Trade Permissions: ${account.tradePermissions}`);
        }
      } catch (err) {
        if (err instanceof AuthenticationError) {
          error(`Authentication failed: ${err.message}`);
        } else if (err instanceof RateLimitError) {
          error('Too many requests. Please try again later.');
        } else if (err instanceof ApiError) {
          error(`Failed to fetch account info: ${err.message}`);
        } else {
          error(
            `Failed to check status: ${err instanceof Error ? err.message : 'Unknown error'}`
          );
        }
        process.exit(1);
      }
    });

  return auth;
}
