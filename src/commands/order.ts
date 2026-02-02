import { Command } from 'commander';
import {
  getOrder,
  ApiError,
  AuthenticationError,
  RateLimitError,
  NotFoundError,
} from '../helpers/api.js';
import {
  error,
  success,
  header,
  subheader,
  row,
  green,
  red,
  yellow,
  cyan,
  isJsonMode,
  outputJson,
} from '../helpers/output.js';

function formatCurrency(value?: string): string {
  if (!value) return 'N/A';
  const num = parseFloat(value);
  if (isNaN(num)) return value;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(num);
}

function formatStatus(status: string): string {
  switch (status) {
    case 'NEW':
      return cyan('New');
    case 'PENDING':
      return yellow('Pending');
    case 'OPEN':
      return cyan('Open');
    case 'FILLED':
      return green('Filled');
    case 'PARTIALLY_FILLED':
      return yellow('Partially Filled');
    case 'CANCELLED':
      return yellow('Cancelled');
    case 'REJECTED':
      return red('Rejected');
    case 'EXPIRED':
      return yellow('Expired');
    default:
      return status;
  }
}

export function createOrderCommand(): Command {
  const order = new Command('order')
    .description('Get order details')
    .argument('<accountId>', 'The account ID')
    .argument('<orderId>', 'The order ID (UUID)')
    .action(async (accountId: string, orderId: string) => {
      try {
        const details = await getOrder(accountId, orderId);

        if (isJsonMode()) {
          outputJson(details);
          return;
        }

        success('Order Details');
        header(
          `${details.instrument.symbol} - ${details.side} ${details.type}`
        );

        row('Order ID:    ', details.orderId);
        row(
          'Symbol:      ',
          `${details.instrument.symbol} (${details.instrument.type})`
        );
        row('Side:        ', details.side);
        row('Type:        ', details.type);
        row('Status:      ', formatStatus(details.status));

        if (details.quantity) {
          row('Quantity:    ', details.quantity);
        }
        if (details.notionalValue) {
          row('Notional:    ', formatCurrency(details.notionalValue));
        }
        if (details.limitPrice) {
          row('Limit Price: ', formatCurrency(details.limitPrice));
        }
        if (details.stopPrice) {
          row('Stop Price:  ', formatCurrency(details.stopPrice));
        }

        row('Time in Force:', details.expiration.timeInForce);
        row('Created:     ', new Date(details.createdAt).toLocaleString());

        if (details.filledQuantity && details.filledQuantity !== '0') {
          subheader('Execution');
          row('Filled Qty:', details.filledQuantity, 4);
          row('Avg Price: ', formatCurrency(details.averagePrice), 4);
        }

        if (details.closedAt) {
          row('Closed:      ', new Date(details.closedAt).toLocaleString());
        }

        if (details.rejectReason) {
          row('Reject Reason:', red(details.rejectReason));
        }

        if (details.legs && details.legs.length > 0) {
          subheader('Legs');
          for (const leg of details.legs) {
            console.log(
              `    ${leg.side} ${leg.instrument.symbol} (${leg.instrument.type})`
            );
            if (leg.ratioQuantity) {
              row('Ratio:', String(leg.ratioQuantity), 6);
            }
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
          error(`Failed to get order: ${err.message}`);
        } else {
          error(
            `Failed to get order: ${err instanceof Error ? err.message : 'Unknown error'}`
          );
        }
        process.exit(1);
      }
    });

  return order;
}
