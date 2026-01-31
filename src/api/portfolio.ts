import { authenticatedFetch, ApiError } from '../helpers/fetch.js';
import { Instrument } from './types.js';

export interface BuyingPower {
  cashOnlyBuyingPower: string;
  buyingPower: string;
  optionsBuyingPower: string;
}

export interface Equity {
  type: string;
  value: string;
  percentageOfPortfolio: string;
}

export interface LastPrice {
  lastPrice: string;
  timestamp: string;
}

export interface Gain {
  gainValue: string;
  gainPercentage: string;
  timestamp?: string;
  lastUpdate?: string;
}

export interface CostBasis {
  totalCost: string;
  unitCost: string;
  gainValue: string;
  gainPercentage: string;
  lastUpdate: string;
}

export interface Position {
  instrument: Instrument;
  quantity: string;
  openedAt: string;
  currentValue: string;
  percentOfPortfolio: string;
  lastPrice: LastPrice;
  instrumentGain: Gain;
  positionDailyGain: Gain;
  costBasis: CostBasis;
}

export interface OrderLeg {
  instrument: Instrument;
  side: string;
  openCloseIndicator: string;
  ratioQuantity: number;
}

export interface Order {
  orderId: string;
  instrument: Instrument;
  createdAt: string;
  type: string;
  side: string;
  status: string;
  quantity: string;
  notionalValue: string;
  expiration: {
    timeInForce: string;
    expirationTime: string;
  };
  limitPrice?: string;
  stopPrice?: string;
  closedAt?: string;
  openCloseIndicator: string;
  filledQuantity: string;
  averagePrice: string;
  legs?: OrderLeg[];
  rejectReason?: string;
}

export interface Portfolio {
  accountId: string;
  accountType: string;
  buyingPower: BuyingPower;
  equity: Equity[];
  positions: Position[];
  orders: Order[];
}

export class NotFoundError extends ApiError {
  constructor(message: string) {
    super(message, 404, false);
    this.name = 'NotFoundError';
  }
}

export async function getPortfolio(accountId: string): Promise<Portfolio> {
  try {
    return await authenticatedFetch<Portfolio>(
      `userapigateway/trading/${encodeURIComponent(accountId)}/portfolio/v2`
    );
  } catch (err) {
    if (err instanceof ApiError && err.statusCode === 404) {
      throw new NotFoundError(`Account '${accountId}' not found`);
    }
    throw err;
  }
}
