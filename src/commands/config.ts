import { Command } from 'commander';
import {
  getEndpoint,
  setEndpoint,
  resetEndpoint,
  getDefaultEndpoint,
} from '../helpers/config.js';
import { success, error, info } from '../helpers/output.js';

function isValidUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

export function createConfigCommand(): Command {
  const config = new Command('config').description('Manage CLI configuration');

  config
    .command('set-endpoint')
    .description('Set the API endpoint URL')
    .argument('<url>', 'The API endpoint URL')
    .action(async (url: string) => {
      try {
        const trimmedUrl = url.trim();

        if (!isValidUrl(trimmedUrl)) {
          error('Invalid URL. Please provide a valid HTTP or HTTPS URL.');
          process.exit(1);
        }

        const normalizedUrl = trimmedUrl.endsWith('/')
          ? trimmedUrl
          : `${trimmedUrl}/`;

        await setEndpoint(normalizedUrl);
        success(`API endpoint set to: ${normalizedUrl}`);
      } catch (err) {
        error(
          `Failed to set endpoint: ${err instanceof Error ? err.message : 'Unknown error'}`
        );
        process.exit(1);
      }
    });

  config
    .command('get-endpoint')
    .description('Show the current API endpoint URL')
    .action(async () => {
      try {
        const endpoint = await getEndpoint();
        const defaultEndpoint = getDefaultEndpoint();
        const isDefault = endpoint === defaultEndpoint;

        info(`API endpoint: ${endpoint}${isDefault ? ' (default)' : ''}`);
      } catch (err) {
        error(
          `Failed to get endpoint: ${err instanceof Error ? err.message : 'Unknown error'}`
        );
        process.exit(1);
      }
    });

  config
    .command('reset-endpoint')
    .description('Reset the API endpoint to default')
    .action(async () => {
      try {
        await resetEndpoint();
        success(`API endpoint reset to default: ${getDefaultEndpoint()}`);
      } catch (err) {
        error(
          `Failed to reset endpoint: ${err instanceof Error ? err.message : 'Unknown error'}`
        );
        process.exit(1);
      }
    });

  return config;
}
