import { Command } from 'commander';
import {
  getOptionChain,
  ApiError,
  AuthenticationError,
  RateLimitError,
  type OptionUnderlyingType,
  type OptionQuote,
} from '../helpers/api.js';
import { error, success, isJsonMode, outputJson } from '../helpers/output.js';

const VALID_UNDERLYING_TYPES: OptionUnderlyingType[] = [
  'EQUITY',
  'UNDERLYING_SECURITY_FOR_INDEX_OPTION',
];

function formatCurrency(value?: string): string {
  if (!value) return '-';
  const num = parseFloat(value);
  if (isNaN(num)) return value;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

function formatNumber(value?: number): string {
  if (value === undefined || value === null) return '-';
  return new Intl.NumberFormat('en-US').format(value);
}

function extractStrike(symbol: string): string {
  const match = symbol.match(/(\d+)$/);
  if (match) {
    const strike = parseInt(match[1], 10) / 1000;
    return strike.toFixed(2);
  }
  return symbol;
}

function printOptionRow(quote: OptionQuote): void {
  const strike = extractStrike(quote.instrument.symbol);
  const last = formatCurrency(quote.last).padStart(10);
  const bid = formatCurrency(quote.bid).padStart(10);
  const ask = formatCurrency(quote.ask).padStart(10);
  const vol = formatNumber(quote.volume).padStart(10);
  const oi = formatNumber(quote.openInterest).padStart(10);

  console.log(
    `  ${strike.padStart(10)}  ${last}  ${bid}  ${ask}  ${vol}  ${oi}`
  );
}

export function createOptionsChainCommand(): Command {
  const chain = new Command('options-chain')
    .description('Get option chain for an instrument and expiration date')
    .argument('<accountId>', 'The account ID')
    .argument('<symbol>', 'The underlying symbol (e.g., AAPL, SPX)')
    .argument('<expiration>', 'Expiration date (YYYY-MM-DD)')
    .option(
      '-t, --type <type>',
      `Underlying type (${VALID_UNDERLYING_TYPES.join(', ')})`,
      'EQUITY'
    )
    .action(
      async (
        accountId: string,
        symbol: string,
        expiration: string,
        options: { type: string }
      ) => {
        try {
          const type = options.type.toUpperCase() as OptionUnderlyingType;
          if (!VALID_UNDERLYING_TYPES.includes(type)) {
            error(
              `Invalid underlying type: ${type}. Valid types: ${VALID_UNDERLYING_TYPES.join(', ')}`
            );
            process.exit(1);
          }

          const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
          if (!dateRegex.test(expiration)) {
            error('Invalid date format. Use YYYY-MM-DD.');
            process.exit(1);
          }

          const response = await getOptionChain(
            accountId,
            { symbol: symbol.toUpperCase(), type },
            expiration
          );

          if (isJsonMode()) {
            outputJson(response);
            return;
          }

          success(
            `\nOption Chain for ${response.baseSymbol} - Expiration: ${expiration}\n`
          );

          const header =
            '      Strike        Last         Bid         Ask      Volume    Open Int';

          if (response.calls.length > 0) {
            console.log('  CALLS:');
            console.log(header);
            console.log('  ' + '-'.repeat(74));
            for (const call of response.calls) {
              if (call.outcome === 'SUCCESS') {
                printOptionRow(call);
              }
            }
            console.log();
          }

          if (response.puts.length > 0) {
            console.log('  PUTS:');
            console.log(header);
            console.log('  ' + '-'.repeat(74));
            for (const put of response.puts) {
              if (put.outcome === 'SUCCESS') {
                printOptionRow(put);
              }
            }
            console.log();
          }

          if (response.calls.length === 0 && response.puts.length === 0) {
            console.log('  No options available for this expiration.');
          }

          console.log();
        } catch (err) {
          if (err instanceof AuthenticationError) {
            error(err.message);
          } else if (err instanceof RateLimitError) {
            error('Too many requests. Please try again later.');
          } else if (err instanceof ApiError) {
            error(`Failed to fetch option chain: ${err.message}`);
          } else {
            error(
              `Failed to fetch option chain: ${err instanceof Error ? err.message : 'Unknown error'}`
            );
          }
          process.exit(1);
        }
      }
    );

  return chain;
}
