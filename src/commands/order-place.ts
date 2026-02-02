import { randomUUID } from 'node:crypto';
import { Command } from 'commander';
import {
  placeOrder,
  ApiError,
  AuthenticationError,
  RateLimitError,
  type OrderSide,
  type OrderType,
  type TimeInForce,
  type MarketSession,
  type OpenCloseIndicator,
} from '../helpers/api.js';
import {
  error,
  success,
  warn,
  header,
  row,
  info,
  isJsonMode,
  outputJson,
} from '../helpers/output.js';

export function createOrderPlaceCommand(): Command {
  const place = new Command('order-place')
    .description('Place a new order')
    .argument('<accountId>', 'The account ID')
    .argument('<symbol>', 'The trading symbol')
    .requiredOption('-s, --side <side>', 'Order side (BUY, SELL)')
    .requiredOption(
      '-T, --order-type <type>',
      'Order type (MARKET, LIMIT, STOP, STOP_LIMIT)'
    )
    .option('-q, --quantity <qty>', 'Order quantity')
    .option('-a, --amount <amt>', 'Dollar amount (alternative to quantity)')
    .option(
      '-l, --limit <price>',
      'Limit price (required for LIMIT/STOP_LIMIT)'
    )
    .option('--stop <price>', 'Stop price (required for STOP/STOP_LIMIT)')
    .option('-t, --type <type>', 'Security type', 'EQUITY')
    .option('--tif <tif>', 'Time in force (DAY, GTD)', 'DAY')
    .option('--session <session>', 'Market session (CORE, EXTENDED)', 'CORE')
    .option(
      '--open-close <oc>',
      'Open/close indicator for options (OPEN, CLOSE)'
    )
    .option(
      '--order-id <id>',
      'Custom order ID (UUID format, auto-generated if not provided)'
    )
    .action(async (accountId: string, symbol: string, options) => {
      try {
        const side = options.side.toUpperCase() as OrderSide;
        const orderType = options.orderType.toUpperCase() as OrderType;

        if (!['BUY', 'SELL'].includes(side)) {
          error('Invalid order side. Use BUY or SELL.');
          process.exit(1);
        }

        if (!['MARKET', 'LIMIT', 'STOP', 'STOP_LIMIT'].includes(orderType)) {
          error('Invalid order type. Use MARKET, LIMIT, STOP, or STOP_LIMIT.');
          process.exit(1);
        }

        if (
          (orderType === 'LIMIT' || orderType === 'STOP_LIMIT') &&
          !options.limit
        ) {
          error('Limit price is required for LIMIT and STOP_LIMIT orders.');
          process.exit(1);
        }

        if (
          (orderType === 'STOP' || orderType === 'STOP_LIMIT') &&
          !options.stop
        ) {
          error('Stop price is required for STOP and STOP_LIMIT orders.');
          process.exit(1);
        }

        if (!options.quantity && !options.amount) {
          error('Either --quantity or --amount is required.');
          process.exit(1);
        }

        const orderId = options.orderId || randomUUID();

        if (!isJsonMode()) {
          warn(`Placing ${side} order for ${symbol.toUpperCase()}...`);
        }

        const response = await placeOrder(accountId, {
          orderId,
          instrument: {
            symbol: symbol.toUpperCase(),
            type: options.type.toUpperCase(),
          },
          orderSide: side,
          orderType: orderType,
          expiration: {
            timeInForce: (options.tif?.toUpperCase() || 'DAY') as TimeInForce,
          },
          quantity: options.quantity,
          amount: options.amount,
          limitPrice: options.limit,
          stopPrice: options.stop,
          equityMarketSession: options.session?.toUpperCase() as MarketSession,
          openCloseIndicator:
            options.openClose?.toUpperCase() as OpenCloseIndicator,
        });

        if (isJsonMode()) {
          outputJson(response);
          return;
        }

        success('Order placed successfully!');
        header('Order Details');
        row('Order ID:', response.orderId);
        row('Symbol:  ', symbol.toUpperCase());
        row('Side:    ', side);
        row('Type:    ', orderType);
        if (options.quantity) {
          row('Quantity:', options.quantity);
        }
        if (options.amount) {
          row('Amount:  ', `$${options.amount}`);
        }
        if (options.limit) {
          row('Limit:   ', `$${options.limit}`);
        }
        if (options.stop) {
          row('Stop:    ', `$${options.stop}`);
        }
        console.log();
        info(`Check status: public-cli order ${accountId} ${response.orderId}`);
      } catch (err) {
        if (err instanceof AuthenticationError) {
          error(err.message);
        } else if (err instanceof RateLimitError) {
          error('Too many requests. Please try again later.');
        } else if (err instanceof ApiError) {
          error(`Order placement failed: ${err.message}`);
        } else {
          error(
            `Order placement failed: ${err instanceof Error ? err.message : 'Unknown error'}`
          );
        }
        process.exit(1);
      }
    });

  return place;
}
