import { Command } from 'commander';
import {
  getOrder,
  ApiError,
  AuthenticationError,
  RateLimitError,
  NotFoundError,
} from '../helpers/api.js';
import { error, success } from '../helpers/output.js';

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
      return 'New';
    case 'PENDING':
      return 'Pending';
    case 'OPEN':
      return 'Open';
    case 'FILLED':
      return 'Filled';
    case 'PARTIALLY_FILLED':
      return 'Partially Filled';
    case 'CANCELLED':
      return 'Cancelled';
    case 'REJECTED':
      return 'Rejected';
    case 'EXPIRED':
      return 'Expired';
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

        success(`\nOrder Details:\n`);

        console.log(`  Order ID:     ${details.orderId}`);
        console.log(
          `  Symbol:       ${details.instrument.symbol} (${details.instrument.type})`
        );
        console.log(`  Side:         ${details.side}`);
        console.log(`  Type:         ${details.type}`);
        console.log(`  Status:       ${formatStatus(details.status)}`);

        if (details.quantity) {
          console.log(`  Quantity:     ${details.quantity}`);
        }
        if (details.notionalValue) {
          console.log(
            `  Notional:     ${formatCurrency(details.notionalValue)}`
          );
        }
        if (details.limitPrice) {
          console.log(`  Limit Price:  ${formatCurrency(details.limitPrice)}`);
        }
        if (details.stopPrice) {
          console.log(`  Stop Price:   ${formatCurrency(details.stopPrice)}`);
        }

        console.log(`  Time in Force: ${details.expiration.timeInForce}`);
        console.log(
          `  Created:      ${new Date(details.createdAt).toLocaleString()}`
        );

        if (details.filledQuantity && details.filledQuantity !== '0') {
          console.log(`\n  Execution:`);
          console.log(`    Filled Qty: ${details.filledQuantity}`);
          console.log(
            `    Avg Price:  ${formatCurrency(details.averagePrice)}`
          );
        }

        if (details.closedAt) {
          console.log(
            `  Closed:       ${new Date(details.closedAt).toLocaleString()}`
          );
        }

        if (details.rejectReason) {
          console.log(`  Reject Reason: ${details.rejectReason}`);
        }

        if (details.legs && details.legs.length > 0) {
          console.log('\n  Legs:');
          for (const leg of details.legs) {
            console.log(
              `    ${leg.side} ${leg.instrument.symbol} (${leg.instrument.type})`
            );
            if (leg.ratioQuantity) {
              console.log(`      Ratio: ${leg.ratioQuantity}`);
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
