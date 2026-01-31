import { Command } from 'commander';
import {
  preflightSingleLeg,
  ApiError,
  AuthenticationError,
  RateLimitError,
  type OrderSide,
  type OrderType,
  type TimeInForce,
  type MarketSession,
  type OpenCloseIndicator,
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

export function createOrderPreflightCommand(): Command {
  const preflight = new Command('order-preflight')
    .description('Preview estimated costs for a single-leg order')
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

        const response = await preflightSingleLeg(accountId, {
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

        success(`\nOrder Preflight for ${symbol.toUpperCase()}:\n`);

        console.log(
          `  Order Value:      ${formatCurrency(response.orderValue)}`
        );
        console.log(
          `  Est. Commission:  ${formatCurrency(response.estimatedCommission)}`
        );

        if (response.regulatoryFees) {
          const fees = response.regulatoryFees;
          const totalFees = [
            fees.secFee,
            fees.tafFee,
            fees.orfFee,
            fees.occFee,
            fees.catFee,
          ]
            .filter(Boolean)
            .reduce((sum, fee) => sum + parseFloat(fee || '0'), 0);
          if (totalFees > 0) {
            console.log(
              `  Regulatory Fees:  ${formatCurrency(totalFees.toString())}`
            );
          }
        }

        if (side === 'BUY') {
          console.log(
            `  Est. Cost:        ${formatCurrency(response.estimatedCost)}`
          );
        } else {
          console.log(
            `  Est. Proceeds:    ${formatCurrency(response.estimatedProceeds)}`
          );
        }

        console.log(
          `  Buying Power Req: ${formatCurrency(response.buyingPowerRequirement)}`
        );

        if (response.marginRequirement) {
          if (response.marginRequirement.initialRequirement) {
            console.log(
              `  Initial Margin:   ${formatCurrency(response.marginRequirement.initialRequirement)}`
            );
          }
          if (response.marginRequirement.maintenanceRequirement) {
            console.log(
              `  Maint. Margin:    ${formatCurrency(response.marginRequirement.maintenanceRequirement)}`
            );
          }
        }

        if (response.optionDetails) {
          console.log('\n  Option Details:');
          if (response.optionDetails.strikePrice) {
            console.log(
              `    Strike:     ${formatCurrency(response.optionDetails.strikePrice)}`
            );
          }
          if (response.optionDetails.expirationDate) {
            console.log(
              `    Expiration: ${response.optionDetails.expirationDate}`
            );
          }
          if (response.optionDetails.optionType) {
            console.log(`    Type:       ${response.optionDetails.optionType}`);
          }
        }

        console.log();
      } catch (err) {
        if (err instanceof AuthenticationError) {
          error(err.message);
        } else if (err instanceof RateLimitError) {
          error('Too many requests. Please try again later.');
        } else if (err instanceof ApiError) {
          error(`Preflight failed: ${err.message}`);
        } else {
          error(
            `Preflight failed: ${err instanceof Error ? err.message : 'Unknown error'}`
          );
        }
        process.exit(1);
      }
    });

  return preflight;
}
