import { Command } from 'commander';
import {
  cancelOrder,
  ApiError,
  AuthenticationError,
  RateLimitError,
  NotFoundError,
} from '../helpers/api.js';
import { error, success, info } from '../helpers/output.js';

export function createOrderCancelCommand(): Command {
  const cancel = new Command('order-cancel')
    .description('Cancel an open order')
    .argument('<accountId>', 'The account ID')
    .argument('<orderId>', 'The order ID (UUID)')
    .action(async (accountId: string, orderId: string) => {
      try {
        await cancelOrder(accountId, orderId);

        success(`\nCancellation request submitted for order: ${orderId}\n`);
        info('Note: Confirm cancellation by checking order status with:');
        console.log(`  public-cli order ${accountId} ${orderId}\n`);
      } catch (err) {
        if (err instanceof NotFoundError) {
          error(err.message);
        } else if (err instanceof AuthenticationError) {
          error(err.message);
        } else if (err instanceof RateLimitError) {
          error('Too many requests. Please try again later.');
        } else if (err instanceof ApiError) {
          error(`Failed to cancel order: ${err.message}`);
        } else {
          error(
            `Failed to cancel order: ${err instanceof Error ? err.message : 'Unknown error'}`
          );
        }
        process.exit(1);
      }
    });

  return cancel;
}
