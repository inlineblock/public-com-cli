import { Command } from 'commander';
import {
  getQuotes,
  ApiError,
  AuthenticationError,
  RateLimitError,
  type QuoteSecurityType,
  type QuoteInstrument,
} from '../helpers/api.js';
import {
  error,
  success,
  row,
  bold,
  dim,
  red,
} from '../helpers/output.js';

const VALID_QUOTE_TYPES: QuoteSecurityType[] = [
  'EQUITY',
  'OPTION',
  'CRYPTO',
  'INDEX',
];

function formatCurrency(value?: string): string {
  if (!value) return 'N/A';
  const num = parseFloat(value);
  if (isNaN(num)) return value;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(num);
}

function formatNumber(value?: number): string {
  if (value === undefined || value === null) return 'N/A';
  return new Intl.NumberFormat('en-US').format(value);
}

export function createQuotesCommand(): Command {
  const quotes = new Command('quotes')
    .description('Get quotes for one or more instruments')
    .argument('<accountId>', 'The account ID')
    .argument('<symbols...>', 'Symbols to get quotes for (e.g., AAPL TSLA BTC)')
    .option(
      '-t, --type <type>',
      `Security type for all symbols (${VALID_QUOTE_TYPES.join(', ')})`,
      'EQUITY'
    )
    .action(
      async (
        accountId: string,
        symbols: string[],
        options: { type: string }
      ) => {
        try {
          const type = options.type.toUpperCase() as QuoteSecurityType;
          if (!VALID_QUOTE_TYPES.includes(type)) {
            error(
              `Invalid security type: ${type}. Valid types: ${VALID_QUOTE_TYPES.join(', ')}`
            );
            process.exit(1);
          }

          const instruments: QuoteInstrument[] = symbols.map((symbol) => ({
            symbol: symbol.toUpperCase(),
            type,
          }));

          const response = await getQuotes(accountId, instruments);

          if (response.quotes.length === 0) {
            console.log('\nNo quotes returned.');
            return;
          }

          success('Quotes');
          console.log();

          for (const quote of response.quotes) {
            if (quote.outcome !== 'SUCCESS') {
              console.log(`  ${red(quote.instrument.symbol)}: Failed to get quote`);
              continue;
            }

            console.log(
              `  ${bold(quote.instrument.symbol)} ${dim(`(${quote.instrument.type})`)}`
            );
            row('Last:    ', bold(formatCurrency(quote.last)), 4);
            row(
              'Bid:     ',
              `${formatCurrency(quote.bid)} ${dim(`x ${formatNumber(quote.bidSize)}`)}`,
              4
            );
            row(
              'Ask:     ',
              `${formatCurrency(quote.ask)} ${dim(`x ${formatNumber(quote.askSize)}`)}`,
              4
            );
            row('Volume:  ', formatNumber(quote.volume), 4);
            if (quote.openInterest !== undefined) {
              row('Open Int:', formatNumber(quote.openInterest), 4);
            }
            if (quote.lastTimestamp) {
              row(
                'As of:   ',
                dim(new Date(quote.lastTimestamp).toLocaleString()),
                4
              );
            }
            console.log();
          }
        } catch (err) {
          if (err instanceof AuthenticationError) {
            error(err.message);
          } else if (err instanceof RateLimitError) {
            error('Too many requests. Please try again later.');
          } else if (err instanceof ApiError) {
            error(`Failed to fetch quotes: ${err.message}`);
          } else {
            error(
              `Failed to fetch quotes: ${err instanceof Error ? err.message : 'Unknown error'}`
            );
          }
          process.exit(1);
        }
      }
    );

  return quotes;
}
