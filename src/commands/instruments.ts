import { Command } from 'commander';
import {
  getInstruments,
  ApiError,
  AuthenticationError,
  RateLimitError,
  type SecurityType,
  type TradingStatus,
} from '../helpers/api.js';
import { error, success, isJsonMode, outputJson } from '../helpers/output.js';

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

const VALID_TRADING_STATUSES: TradingStatus[] = [
  'BUY_AND_SELL',
  'BUY_ONLY',
  'SELL_ONLY',
  'LIQUIDATION_ONLY',
  'DISABLED',
  'NONE',
];

function parseSecurityTypes(value: string): SecurityType[] {
  const types = value.split(',').map((t) => t.trim().toUpperCase());
  for (const type of types) {
    if (!VALID_SECURITY_TYPES.includes(type as SecurityType)) {
      throw new Error(
        `Invalid security type: ${type}. Valid types: ${VALID_SECURITY_TYPES.join(', ')}`
      );
    }
  }
  return types as SecurityType[];
}

function parseTradingStatuses(value: string): TradingStatus[] {
  const statuses = value.split(',').map((s) => s.trim().toUpperCase());
  for (const status of statuses) {
    if (!VALID_TRADING_STATUSES.includes(status as TradingStatus)) {
      throw new Error(
        `Invalid trading status: ${status}. Valid statuses: ${VALID_TRADING_STATUSES.join(', ')}`
      );
    }
  }
  return statuses as TradingStatus[];
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
      return 'Liquidation';
    case 'DISABLED':
      return 'Disabled';
    case 'NONE':
      return 'None';
    default:
      return status;
  }
}

export function createInstrumentsCommand(): Command {
  const instruments = new Command('instruments')
    .description('List available trading instruments')
    .option(
      '-t, --type <types>',
      `Filter by security type (comma-separated: ${VALID_SECURITY_TYPES.join(', ')})`,
      parseSecurityTypes
    )
    .option(
      '--trading <statuses>',
      `Filter by trading status (comma-separated: ${VALID_TRADING_STATUSES.join(', ')})`,
      parseTradingStatuses
    )
    .option(
      '--fractional <statuses>',
      'Filter by fractional trading status',
      parseTradingStatuses
    )
    .option(
      '--options <statuses>',
      'Filter by option trading status',
      parseTradingStatuses
    )
    .option(
      '--spreads <statuses>',
      'Filter by option spread trading status',
      parseTradingStatuses
    )
    .action(
      async (options: {
        type?: SecurityType[];
        trading?: TradingStatus[];
        fractional?: TradingStatus[];
        options?: TradingStatus[];
        spreads?: TradingStatus[];
      }) => {
        try {
          const response = await getInstruments({
            typeFilter: options.type,
            tradingFilter: options.trading,
            fractionalTradingFilter: options.fractional,
            optionTradingFilter: options.options,
            optionSpreadTradingFilter: options.spreads,
          });

          if (isJsonMode()) {
            outputJson(response.instruments);
            return;
          }

          if (response.instruments.length === 0) {
            console.log('\nNo instruments found matching the criteria.');
            return;
          }

          success(
            `\nFound ${response.instruments.length} instrument${response.instruments.length > 1 ? 's' : ''}:\n`
          );

          console.log(
            '  Symbol'.padEnd(12) +
              'Type'.padEnd(10) +
              'Trading'.padEnd(14) +
              'Fractional'.padEnd(14) +
              'Options'.padEnd(14) +
              'Spreads'
          );
          console.log('  ' + '-'.repeat(70));

          for (const entry of response.instruments) {
            const symbol = entry.instrument.symbol.padEnd(10);
            const type = entry.instrument.type.padEnd(8);
            const trading = formatTradingStatus(entry.trading).padEnd(12);
            const fractional = formatTradingStatus(
              entry.fractionalTrading
            ).padEnd(12);
            const optionTrading = formatTradingStatus(
              entry.optionTrading
            ).padEnd(12);
            const spreads = formatTradingStatus(entry.optionSpreadTrading);

            console.log(
              `  ${symbol}  ${type}  ${trading}  ${fractional}  ${optionTrading}  ${spreads}`
            );
          }

          console.log();
        } catch (err) {
          if (err instanceof AuthenticationError) {
            error(err.message);
          } else if (err instanceof RateLimitError) {
            error('Too many requests. Please try again later.');
          } else if (err instanceof ApiError) {
            error(`Failed to fetch instruments: ${err.message}`);
          } else {
            error(
              `Failed to fetch instruments: ${err instanceof Error ? err.message : 'Unknown error'}`
            );
          }
          process.exit(1);
        }
      }
    );

  return instruments;
}
