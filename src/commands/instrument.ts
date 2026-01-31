import { Command } from 'commander';
import {
  getInstrument,
  ApiError,
  AuthenticationError,
  RateLimitError,
  NotFoundError,
  type SecurityType,
} from '../helpers/api.js';
import {
  error,
  success,
  header,
  row,
  subheader,
  bold,
  dim,
  green,
  yellow,
  red,
} from '../helpers/output.js';

const VALID_SECURITY_TYPES: SecurityType[] = [
  'EQUITY',
  'ETF',
  'ADR',
  'CRYPTO',
  'OPTION',
  'MULTI_LEG_INSTRUMENT',
  'ALT',
  'TREASURY',
  'BOND',
  'INDEX',
];

function parseSecurityType(value: string): SecurityType {
  const type = value.trim().toUpperCase();
  if (!VALID_SECURITY_TYPES.includes(type as SecurityType)) {
    throw new Error(
      `Invalid security type: ${type}. Valid types: ${VALID_SECURITY_TYPES.join(', ')}`
    );
  }
  return type as SecurityType;
}

function formatTradingStatus(status: string): string {
  switch (status) {
    case 'BUY_AND_SELL':
      return green('Buy & Sell');
    case 'BUY_ONLY':
      return yellow('Buy Only');
    case 'SELL_ONLY':
      return yellow('Sell Only');
    case 'LIQUIDATION_ONLY':
      return red('Liquidation Only');
    case 'DISABLED':
      return red('Disabled');
    case 'NONE':
      return dim('None');
    default:
      return status;
  }
}

export function createInstrumentCommand(): Command {
  const instrument = new Command('instrument')
    .description('Get details for a specific instrument')
    .argument('<symbol>', 'The trading symbol (e.g., AAPL, BTC)')
    .option(
      '-t, --type <type>',
      `Security type (${VALID_SECURITY_TYPES.join(', ')})`,
      parseSecurityType,
      'EQUITY' as SecurityType
    )
    .action(async (symbol: string, options: { type: SecurityType }) => {
      try {
        const data = await getInstrument(symbol.toUpperCase(), options.type);

        success(`Instrument: ${bold(data.instrument.symbol)}`);
        header(`${data.instrument.symbol} (${data.instrument.type})`);

        row('Trading:      ', formatTradingStatus(data.trading));
        row('Fractional:   ', formatTradingStatus(data.fractionalTrading));
        row('Options:      ', formatTradingStatus(data.optionTrading));
        row('Option Spreads:', formatTradingStatus(data.optionSpreadTrading));

        if (data.instrumentDetails) {
          subheader('Details');
          const details = data.instrumentDetails as Record<string, unknown>;
          for (const [key, value] of Object.entries(details)) {
            row(`${key}:`, String(value), 4);
          }
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
          error(`Failed to fetch instrument: ${err.message}`);
        } else {
          error(
            `Failed to fetch instrument: ${err instanceof Error ? err.message : 'Unknown error'}`
          );
        }
        process.exit(1);
      }
    });

  return instrument;
}
