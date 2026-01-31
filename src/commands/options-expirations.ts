import { Command } from 'commander';
import {
  getOptionExpirations,
  ApiError,
  AuthenticationError,
  RateLimitError,
  type OptionUnderlyingType,
} from '../helpers/api.js';
import { error, success } from '../helpers/output.js';

const VALID_UNDERLYING_TYPES: OptionUnderlyingType[] = [
  'EQUITY',
  'UNDERLYING_SECURITY_FOR_INDEX_OPTION',
];

export function createOptionsExpirationsCommand(): Command {
  const expirations = new Command('options-expirations')
    .description('Get available option expiration dates for an instrument')
    .argument('<accountId>', 'The account ID')
    .argument('<symbol>', 'The underlying symbol (e.g., AAPL, SPX)')
    .option(
      '-t, --type <type>',
      `Underlying type (${VALID_UNDERLYING_TYPES.join(', ')})`,
      'EQUITY'
    )
    .action(
      async (accountId: string, symbol: string, options: { type: string }) => {
        try {
          const type = options.type.toUpperCase() as OptionUnderlyingType;
          if (!VALID_UNDERLYING_TYPES.includes(type)) {
            error(
              `Invalid underlying type: ${type}. Valid types: ${VALID_UNDERLYING_TYPES.join(', ')}`
            );
            process.exit(1);
          }

          const response = await getOptionExpirations(accountId, {
            symbol: symbol.toUpperCase(),
            type,
          });

          success(`\nOption Expirations for ${response.baseSymbol}:\n`);

          if (response.expirations.length === 0) {
            console.log('  No expiration dates available.');
            return;
          }

          for (const expiration of response.expirations) {
            const date = new Date(expiration);
            console.log(
              `  ${expiration}  (${date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })})`
            );
          }

          console.log(
            `\n  Total: ${response.expirations.length} expiration dates\n`
          );
        } catch (err) {
          if (err instanceof AuthenticationError) {
            error(err.message);
          } else if (err instanceof RateLimitError) {
            error('Too many requests. Please try again later.');
          } else if (err instanceof ApiError) {
            error(`Failed to fetch option expirations: ${err.message}`);
          } else {
            error(
              `Failed to fetch option expirations: ${err instanceof Error ? err.message : 'Unknown error'}`
            );
          }
          process.exit(1);
        }
      }
    );

  return expirations;
}
