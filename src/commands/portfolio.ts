import { Command } from 'commander';
import {
  getPortfolio,
  ApiError,
  AuthenticationError,
  RateLimitError,
  NotFoundError,
} from '../helpers/api.js';
import {
  error,
  header,
  subheader,
  row,
  bold,
  green,
  red,
  yellow,
  cyan,
  dim,
  isJsonMode,
  outputJson,
} from '../helpers/output.js';

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
  const formatted = `${formatCurrency(value)} (${formatPercent(percentage)})`;
  if (numValue > 0) return green('+' + formatted.substring(1));
  if (numValue < 0) return red(formatted);
  return formatted;
}

function formatStatus(status: string): string {
  switch (status) {
    case 'NEW':
      return cyan('NEW');
    case 'PENDING':
      return yellow('PENDING');
    case 'OPEN':
      return cyan('OPEN');
    case 'FILLED':
      return green('FILLED');
    case 'PARTIALLY_FILLED':
      return yellow('PARTIAL');
    case 'CANCELLED':
      return yellow('CANCELLED');
    case 'REJECTED':
      return red('REJECTED');
    default:
      return status;
  }
}

export function createPortfolioCommand(): Command {
  const portfolio = new Command('portfolio')
    .description('View portfolio for an account')
    .argument('<accountId>', 'The account ID')
    .action(async (accountId: string) => {
      try {
        const data = await getPortfolio(accountId);

        if (isJsonMode()) {
          outputJson(data);
          return;
        }

        header(`Account: ${data.accountId} (${data.accountType})`);

        subheader('Buying Power');
        row(
          'Cash Only:',
          bold(formatCurrency(data.buyingPower.cashOnlyBuyingPower))
        );
        row('Total:    ', bold(formatCurrency(data.buyingPower.buyingPower)));
        row(
          'Options:  ',
          bold(formatCurrency(data.buyingPower.optionsBuyingPower))
        );

        if (data.equity.length > 0) {
          subheader('Equity');
          for (const eq of data.equity) {
            const pct = formatPercent(eq.percentageOfPortfolio);
            row(
              `${eq.type}:`,
              `${bold(formatCurrency(eq.value))} ${dim(`(${pct} of portfolio)`)}`
            );
          }
        }

        if (data.positions.length > 0) {
          subheader('Positions');
          for (const pos of data.positions) {
            console.log(
              `\n  ${bold(pos.instrument.symbol)} ${dim('- ' + (pos.instrument.name || pos.instrument.type))}`
            );
            row('Quantity:      ', pos.quantity, 4);
            row('Current Value: ', bold(formatCurrency(pos.currentValue)), 4);
            row('Last Price:    ', formatCurrency(pos.lastPrice.lastPrice), 4);
            row(
              'Cost Basis:    ',
              `${formatCurrency(pos.costBasis.totalCost)} ${dim(`(${formatCurrency(pos.costBasis.unitCost)}/share)`)}`,
              4
            );
            row(
              'Total Gain:    ',
              formatGain(
                pos.instrumentGain.gainValue,
                pos.instrumentGain.gainPercentage
              ),
              4
            );
            row(
              'Daily Gain:    ',
              formatGain(
                pos.positionDailyGain.gainValue,
                pos.positionDailyGain.gainPercentage
              ),
              4
            );
            row('% of Portfolio:', formatPercent(pos.percentOfPortfolio), 4);
          }
        } else {
          console.log('\n  No positions.');
        }

        if (data.orders.length > 0) {
          subheader('Open Orders');
          for (const order of data.orders) {
            const quantityDisplay = order.quantity
              ? order.quantity
              : order.notionalValue
                ? formatCurrency(order.notionalValue)
                : '';
            console.log(
              `\n  ${bold(order.side)} ${quantityDisplay} ${bold(order.instrument.symbol)}`
            );
            row('Order ID:  ', dim(order.orderId), 4);
            row('Type:      ', order.type, 4);
            row('Status:    ', formatStatus(order.status), 4);
            if (order.limitPrice) {
              row('Limit:     ', formatCurrency(order.limitPrice), 4);
            }
            if (order.stopPrice) {
              row('Stop:      ', formatCurrency(order.stopPrice), 4);
            }
            row('Expiration:', order.expiration.timeInForce, 4);
            row('Created:   ', new Date(order.createdAt).toLocaleString(), 4);
            if (order.filledQuantity && order.filledQuantity !== '0') {
              row(
                'Filled:    ',
                `${order.filledQuantity} @ ${formatCurrency(order.averagePrice)}`,
                4
              );
            }
            if (order.rejectReason) {
              row('Rejected:  ', red(order.rejectReason), 4);
            }
          }
        } else {
          console.log('\n  No open orders.');
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
