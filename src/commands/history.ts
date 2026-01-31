import { Command } from 'commander';
import {
  getHistory,
  ApiError,
  AuthenticationError,
  RateLimitError,
  NotFoundError,
  type Transaction,
} from '../helpers/api.js';
import { error, info } from '../helpers/output.js';

function formatCurrency(value: string): string {
  const num = parseFloat(value);
  if (isNaN(num)) return value;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(num);
}

function formatDate(timestamp: string): string {
  return new Date(timestamp).toLocaleString();
}

function formatTransaction(tx: Transaction): void {
  const amount = formatCurrency(tx.netAmount);

  console.log(`\n  ${formatDate(tx.timestamp)}`);
  console.log(`    ${tx.type}${tx.subType ? ` / ${tx.subType}` : ''}`);
  console.log(`    ${tx.description}`);

  if (tx.symbol) {
    console.log(`    Symbol: ${tx.symbol} (${tx.securityType || 'N/A'})`);
  }

  if (tx.quantity && tx.side) {
    console.log(`    ${tx.side} ${tx.quantity} shares`);
  }

  console.log(`    Amount: ${amount} (${tx.direction})`);

  if (tx.fees && parseFloat(tx.fees) !== 0) {
    console.log(`    Fees: ${formatCurrency(tx.fees)}`);
  }
}

function validateDateFormat(value: string): string {
  const date = new Date(value);
  if (isNaN(date.getTime())) {
    throw new Error(
      `Invalid date format: ${value}. Use ISO 8601 format (e.g., 2025-01-15T09:00:00Z)`
    );
  }
  return value;
}

export function createHistoryCommand(): Command {
  const history = new Command('history')
    .description('View transaction history for an account')
    .argument('<accountId>', 'The account ID')
    .option(
      '-s, --start <datetime>',
      'Start timestamp (ISO 8601 format)',
      validateDateFormat
    )
    .option(
      '-e, --end <datetime>',
      'End timestamp (ISO 8601 format)',
      validateDateFormat
    )
    .option('-n, --limit <number>', 'Maximum number of records', (v) =>
      parseInt(v, 10)
    )
    .option('--next-token <token>', 'Pagination token for next page')
    .action(
      async (
        accountId: string,
        options: {
          start?: string;
          end?: string;
          limit?: number;
          nextToken?: string;
        }
      ) => {
        try {
          const response = await getHistory(accountId, {
            start: options.start,
            end: options.end,
            pageSize: options.limit,
            nextToken: options.nextToken,
          });

          console.log(`\nTransaction History for Account: ${accountId}`);
          console.log(
            `Period: ${formatDate(response.start)} - ${formatDate(response.end)}`
          );

          if (response.transactions.length === 0) {
            info('\nNo transactions found for this period.');
            return;
          }

          console.log(
            `\nShowing ${response.transactions.length} transaction${response.transactions.length > 1 ? 's' : ''}:`
          );

          for (const tx of response.transactions) {
            formatTransaction(tx);
          }

          if (response.nextToken) {
            console.log(
              `\n  More results available. Use --next-token "${response.nextToken}" to see next page.`
            );
          }

          console.log();
        } catch (err) {
          if (err instanceof NotFoundError) {
            error(err.message);
          } else if (err instanceof AuthenticationError) {
            error(err.message);
          } else if (err instanceof RateLimitError) {
            error('Too many requests. Please try again later.');
          } else if (err instanceof ApiError) {
            error(`Failed to fetch history: ${err.message}`);
          } else {
            error(
              `Failed to fetch history: ${err instanceof Error ? err.message : 'Unknown error'}`
            );
          }
          process.exit(1);
        }
      }
    );

  return history;
}
