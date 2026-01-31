import { Command } from 'commander';
import {
  storeApiKey,
  deleteApiKey,
  hasApiKey,
} from '../authentication/keychain.js';
import { success, error, info } from '../helpers/output.js';
import { isValidApiKey } from '../helpers/validation.js';

export function createAuthenticateCommand(): Command {
  const auth = new Command('auth').description(
    'Manage authentication with Public.com API'
  );

  auth
    .command('login')
    .description('Store your Public.com API key securely')
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

        await storeApiKey(apiKey);
        success('API key stored securely in system keychain.');
      } catch (err) {
        error(
          `Failed to store API key: ${err instanceof Error ? err.message : 'Unknown error'}`
        );
        process.exit(1);
      }
    });

  auth
    .command('logout')
    .description('Remove stored API key from system keychain')
    .action(async () => {
      try {
        const deleted = await deleteApiKey();
        if (deleted) {
          success('API key removed from system keychain.');
        } else {
          info('No API key was stored.');
        }
      } catch (err) {
        error(
          `Failed to remove API key: ${err instanceof Error ? err.message : 'Unknown error'}`
        );
        process.exit(1);
      }
    });

  auth
    .command('status')
    .description('Check if an API key is stored')
    .action(async () => {
      try {
        const hasKey = await hasApiKey();
        if (hasKey) {
          success('API key is configured.');
        } else {
          info(
            'No API key stored. Run "public-cli auth login -k <key>" to authenticate.'
          );
        }
      } catch (err) {
        error(
          `Failed to check authentication status: ${err instanceof Error ? err.message : 'Unknown error'}`
        );
        process.exit(1);
      }
    });

  return auth;
}
