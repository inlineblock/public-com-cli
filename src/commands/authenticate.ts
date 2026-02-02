import { Command } from 'commander';
import {
  storeApiKey,
  deleteApiKey,
  hasApiKey,
} from '../authentication/keychain.js';
import {
  success,
  error,
  info,
  header,
  row,
  bold,
  dim,
  isJsonMode,
  outputJson,
} from '../helpers/output.js';
import { isValidApiKey } from '../helpers/validation.js';
import {
  validateApiKey,
  clearTokens,
  getAccounts,
  ApiError,
  AuthenticationError,
  RateLimitError,
} from '../helpers/api.js';
import { promptSecret } from '../helpers/prompt.js';

export function createAuthenticateCommand(): Command {
  const auth = new Command('auth').description(
    'Manage authentication with Public.com API'
  );

  auth
    .command('login')
    .description('Authenticate with your Public.com API key')
    .option('-k, --key <apiKey>', 'Your Public.com API key')
    .action(async (options: { key?: string }) => {
      try {
        let apiKey: string;

        if (options.key) {
          apiKey = options.key.trim();
        } else {
          console.log();
          console.log(dim('To get your API key:'));
          console.log(dim('  1. Log into your Public.com account'));
          console.log(dim('  2. Go to Settings > API'));
          console.log(dim('  3. Generate a secret key'));
          console.log();
          apiKey = await promptSecret('Enter API key: ');
        }

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
          if (isJsonMode()) {
            outputJson({ authenticated: false });
            return;
          }
          info(
            'Not authenticated. Run "public-cli auth login" to authenticate.'
          );
          process.exit(0);
        }

        if (!isJsonMode()) {
          info('Fetching account information...');
        }

        const { accounts } = await getAccounts();

        if (isJsonMode()) {
          outputJson({ authenticated: true, accounts });
          return;
        }

        success('Authenticated');

        if (accounts.length === 0) {
          info('No accounts found.');
          return;
        }

        header('Accounts');
        for (const account of accounts) {
          console.log(
            `\n  ${bold(account.accountId)} ${dim(`(${account.accountType})`)}`
          );
          row('Brokerage Type:   ', account.brokerageAccountType, 4);
          row('Options Level:    ', account.optionsLevel, 4);
          row('Trade Permissions:', account.tradePermissions, 4);
        }
        console.log();
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
