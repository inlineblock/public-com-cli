import { Command } from 'commander';
import {
  getInstrument,
  ApiError,
  AuthenticationError,
  RateLimitError,
  NotFoundError,
  type SecurityType,
} from '../helpers/api.js';
import { error, success } from '../helpers/output.js';

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
      return 'Buy & Sell';
    case 'BUY_ONLY':
      return 'Buy Only';
    case 'SELL_ONLY':
      return 'Sell Only';
    case 'LIQUIDATION_ONLY':
      return 'Liquidation Only';
    case 'DISABLED':
      return 'Disabled';
    case 'NONE':
      return 'None';
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

        success(`\nInstrument: ${data.instrument.symbol}\n`);

        console.log(`  Type:              ${data.instrument.type}`);
        console.log(
          `  Trading:           ${formatTradingStatus(data.trading)}`
        );
        console.log(
          `  Fractional:        ${formatTradingStatus(data.fractionalTrading)}`
        );
        console.log(
          `  Options:           ${formatTradingStatus(data.optionTrading)}`
        );
        console.log(
          `  Option Spreads:    ${formatTradingStatus(data.optionSpreadTrading)}`
        );

        if (data.instrumentDetails) {
          console.log('\n  Details:');
          const details = data.instrumentDetails as Record<string, unknown>;
          for (const [key, value] of Object.entries(details)) {
            console.log(`    ${key}: ${JSON.stringify(value)}`);
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
