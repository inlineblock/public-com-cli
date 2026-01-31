import { Command } from 'commander';
import {
  getPortfolio,
  ApiError,
  AuthenticationError,
  RateLimitError,
  NotFoundError,
} from '../helpers/api.js';
import { error } from '../helpers/output.js';

function formatCurrency(value: string): string {
  const num = parseFloat(value);
  if (isNaN(num)) return value;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(num);
}

function formatPercent(value: string): string {
  const num = parseFloat(value);
  if (isNaN(num)) return value;
  return `${num >= 0 ? '+' : ''}${num.toFixed(2)}%`;
}

function formatGain(value: string, percentage: string): string {
  const numValue = parseFloat(value);
  const prefix = numValue >= 0 ? '+' : '';
  return `${prefix}${formatCurrency(value)} (${formatPercent(percentage)})`;
}

export function createPortfolioCommand(): Command {
  const portfolio = new Command('portfolio')
    .description('View portfolio for an account')
    .argument('<accountId>', 'The account ID')
    .action(async (accountId: string) => {
      try {
        const data = await getPortfolio(accountId);

        console.log(`\nAccount: ${data.accountId} (${data.accountType})\n`);

        console.log('Buying Power:');
        console.log(
          `  Cash Only:  ${formatCurrency(data.buyingPower.cashOnlyBuyingPower)}`
        );
        console.log(
          `  Total:      ${formatCurrency(data.buyingPower.buyingPower)}`
        );
        console.log(
          `  Options:    ${formatCurrency(data.buyingPower.optionsBuyingPower)}`
        );

        if (data.equity.length > 0) {
          console.log('\nEquity:');
          for (const eq of data.equity) {
            console.log(
              `  ${eq.type}: ${formatCurrency(eq.value)} (${formatPercent(eq.percentageOfPortfolio)} of portfolio)`
            );
          }
        }

        if (data.positions.length > 0) {
          console.log('\nPositions:');
          for (const pos of data.positions) {
            console.log(
              `\n  ${pos.instrument.symbol} - ${pos.instrument.name || pos.instrument.type}`
            );
            console.log(`    Quantity:      ${pos.quantity}`);
            console.log(
              `    Current Value: ${formatCurrency(pos.currentValue)}`
            );
            console.log(
              `    Last Price:    ${formatCurrency(pos.lastPrice.lastPrice)}`
            );
            console.log(
              `    Cost Basis:    ${formatCurrency(pos.costBasis.totalCost)} (${formatCurrency(pos.costBasis.unitCost)}/share)`
            );
            console.log(
              `    Total Gain:    ${formatGain(pos.instrumentGain.gainValue, pos.instrumentGain.gainPercentage)}`
            );
            console.log(
              `    Daily Gain:    ${formatGain(pos.positionDailyGain.gainValue, pos.positionDailyGain.gainPercentage)}`
            );
            console.log(
              `    % of Portfolio: ${formatPercent(pos.percentOfPortfolio)}`
            );
          }
        } else {
          console.log('\nNo positions.');
        }

        if (data.orders.length > 0) {
          console.log('\nOpen Orders:');
          for (const order of data.orders) {
            const quantityDisplay = order.quantity
              ? order.quantity
              : order.notionalValue
                ? formatCurrency(order.notionalValue)
                : '';
            console.log(
              `\n  ${order.side} ${quantityDisplay} ${order.instrument.symbol}`
            );
            console.log(`    Order ID:   ${order.orderId}`);
            console.log(`    Type:       ${order.type}`);
            console.log(`    Status:     ${order.status}`);
            if (order.limitPrice) {
              console.log(
                `    Limit:      ${formatCurrency(order.limitPrice)}`
              );
            }
            if (order.stopPrice) {
              console.log(`    Stop:       ${formatCurrency(order.stopPrice)}`);
            }
            console.log(`    Expiration: ${order.expiration.timeInForce}`);
            console.log(
              `    Created:    ${new Date(order.createdAt).toLocaleString()}`
            );
            if (order.filledQuantity && order.filledQuantity !== '0') {
              console.log(
                `    Filled:     ${order.filledQuantity} @ ${formatCurrency(order.averagePrice)}`
              );
            }
            if (order.rejectReason) {
              console.log(`    Rejected:   ${order.rejectReason}`);
            }
          }
        } else {
          console.log('\nNo open orders.');
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
          error(`Failed to fetch portfolio: ${err.message}`);
        } else {
          error(
            `Failed to fetch portfolio: ${err instanceof Error ? err.message : 'Unknown error'}`
          );
        }
        process.exit(1);
      }
    });

  return portfolio;
}
