import { Command } from 'commander';
import {
  getOptionGreeks,
  ApiError,
  AuthenticationError,
  RateLimitError,
} from '../helpers/api.js';
import {
  error,
  success,
  row,
  bold,
  cyan,
  isJsonMode,
  outputJson,
} from '../helpers/output.js';

function formatGreek(value?: string): string {
  if (!value) return 'N/A';
  const num = parseFloat(value);
  if (isNaN(num)) return value;
  return num.toFixed(4);
}

function formatPercent(value?: string): string {
  if (!value) return 'N/A';
  const num = parseFloat(value);
  if (isNaN(num)) return value;
  return `${(num * 100).toFixed(2)}%`;
}

export function createOptionGreeksCommand(): Command {
  const greeks = new Command('option-greeks')
    .description('Get option Greeks for one or more option symbols')
    .argument('<accountId>', 'The account ID')
    .argument('<symbols...>', 'Option symbols in OSI format (max 250)')
    .action(async (accountId: string, symbols: string[]) => {
      try {
        if (symbols.length > 250) {
          error('Maximum 250 symbols per request.');
          process.exit(1);
        }

        const response = await getOptionGreeks(accountId, symbols);

        if (isJsonMode()) {
          outputJson(response.greeks);
          return;
        }

        if (response.greeks.length === 0) {
          console.log('\nNo Greeks data returned.');
          return;
        }

        success('Option Greeks');
        console.log();

        for (const item of response.greeks) {
          console.log(`  ${bold(item.symbol)}`);
          row('Delta:', cyan(formatGreek(item.greeks.delta)), 4);
          row('Gamma:', formatGreek(item.greeks.gamma), 4);
          row('Theta:', formatGreek(item.greeks.theta), 4);
          row('Vega: ', formatGreek(item.greeks.vega), 4);
          row('Rho:  ', formatGreek(item.greeks.rho), 4);
          row('IV:   ', bold(formatPercent(item.greeks.impliedVolatility)), 4);
          console.log();
        }
      } catch (err) {
        if (err instanceof AuthenticationError) {
          error(err.message);
        } else if (err instanceof RateLimitError) {
          error('Too many requests. Please try again later.');
        } else if (err instanceof ApiError) {
          error(`Failed to get option Greeks: ${err.message}`);
        } else {
          error(
            `Failed to get option Greeks: ${err instanceof Error ? err.message : 'Unknown error'}`
          );
        }
        process.exit(1);
      }
    });

  return greeks;
}
