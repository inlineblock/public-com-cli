import { Command } from 'commander';
import {
  getHistory,
  ApiError,
  AuthenticationError,
  RateLimitError,
  NotFoundError,
  type Transaction,
} from '../helpers/api.js';
import {
  error,
  info,
  header,
  row,
  bold,
  dim,
  green,
  red,
  cyan,
  isJsonMode,
  outputJson,
} from '../helpers/output.js';

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
  const amountNum = parseFloat(tx.netAmount);
  const amountColored =
    tx.direction === 'CREDIT' || amountNum > 0
      ? green(amount)
      : amountNum < 0
        ? red(amount)
        : amount;

  console.log(`\n  ${bold(formatDate(tx.timestamp))}`);
  console.log(
    `    ${cyan(tx.type)}${tx.subType ? dim(` / ${tx.subType}`) : ''}`
  );
  console.log(`    ${tx.description}`);

  if (tx.symbol) {
    row(
      'Symbol:',
      `${bold(tx.symbol)} ${dim(`(${tx.securityType || 'N/A'})`)}`,
      4
    );
  }

  if (tx.quantity && tx.side) {
    row('Trade: ', `${tx.side} ${tx.quantity} shares`, 4);
  }

  row('Amount:', `${amountColored} ${dim(`(${tx.direction})`)}`, 4);

  if (tx.fees && parseFloat(tx.fees) !== 0) {
    row('Fees:  ', red(formatCurrency(tx.fees)), 4);
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

          if (isJsonMode()) {
            outputJson(response);
            return;
          }

          header(`Transaction History: ${accountId}`);
          console.log(
            `  ${dim('Period:')} ${formatDate(response.start)} - ${formatDate(response.end)}`
          );

          if (response.transactions.length === 0) {
            info('No transactions found for this period.');
            return;
          }

          console.log(
            `\n  ${dim(`Showing ${response.transactions.length} transaction${response.transactions.length > 1 ? 's' : ''}`)}`
          );

          for (const tx of response.transactions) {
            formatTransaction(tx);
          }

          if (response.nextToken) {
            console.log();
            info(
              `More results available. Use --next-token "${response.nextToken}"`
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
