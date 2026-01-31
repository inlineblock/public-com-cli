import { authenticatedFetch, ApiError } from '../helpers/fetch.js';
import { NotFoundError } from './portfolio.js';
import { InstrumentInfo } from './types.js';

export type OrderSide = 'BUY' | 'SELL';
export type OrderType = 'MARKET' | 'LIMIT' | 'STOP' | 'STOP_LIMIT';
export type TimeInForce = 'DAY' | 'GTD';
export type MarketSession = 'CORE' | 'EXTENDED';
export type OpenCloseIndicator = 'OPEN' | 'CLOSE';

export interface OrderExpiration {
  timeInForce: TimeInForce;
  expirationTime?: string;
}

export interface OrderInstrument {
  symbol: string;
  type: string;
}

export interface PreflightSingleLegRequest {
  instrument: OrderInstrument;
  orderSide: OrderSide;
  orderType: OrderType;
  expiration: OrderExpiration;
  quantity?: string;
  amount?: string;
  limitPrice?: string;
  stopPrice?: string;
  equityMarketSession?: MarketSession;
  openCloseIndicator?: OpenCloseIndicator;
}

export interface RegulatoryFees {
  secFee?: string;
  tafFee?: string;
  orfFee?: string;
  occFee?: string;
  catFee?: string;
}

export interface MarginRequirement {
  maintenanceRequirement?: string;
  initialRequirement?: string;
}

export interface OptionDetails {
  strikePrice?: string;
  expirationDate?: string;
  optionType?: string;
}

export interface PreflightResponse {
  estimatedCommission?: string;
  regulatoryFees?: RegulatoryFees;
  orderValue?: string;
  estimatedCost?: string;
  buyingPowerRequirement?: string;
  estimatedProceeds?: string;
  marginRequirement?: MarginRequirement;
  optionDetails?: OptionDetails;
}

export async function preflightSingleLeg(
  accountId: string,
  request: PreflightSingleLegRequest
): Promise<PreflightResponse> {
  return authenticatedFetch<PreflightResponse>(
    `userapigateway/trading/${encodeURIComponent(accountId)}/preflight/single-leg`,
    {
      method: 'POST',
      body: request,
    }
  );
}

export interface OrderLegRequest {
  instrument: OrderInstrument;
  orderSide: OrderSide;
  openCloseIndicator?: OpenCloseIndicator;
  ratioQuantity?: number;
}

export interface PreflightMultiLegRequest {
  orderType: OrderType;
  expiration: OrderExpiration;
  limitPrice?: string;
  quantity?: string;
  legs: OrderLegRequest[];
}

export interface PreflightMultiLegResponse extends PreflightResponse {
  baseSymbol?: string;
  strategyName?: string;
  legs?: Array<{
    instrument: InstrumentInfo;
    side: OrderSide;
    optionDetails?: OptionDetails;
  }>;
  priceIncrement?: {
    increment?: string;
  };
}

export async function preflightMultiLeg(
  accountId: string,
  request: PreflightMultiLegRequest
): Promise<PreflightMultiLegResponse> {
  return authenticatedFetch<PreflightMultiLegResponse>(
    `userapigateway/trading/${encodeURIComponent(accountId)}/preflight/multi-leg`,
    {
      method: 'POST',
      body: request,
    }
  );
}

export interface PlaceOrderRequest {
  orderId: string;
  instrument: OrderInstrument;
  orderSide: OrderSide;
  orderType: OrderType;
  expiration: OrderExpiration;
  quantity?: string;
  amount?: string;
  limitPrice?: string;
  stopPrice?: string;
  equityMarketSession?: MarketSession;
  openCloseIndicator?: OpenCloseIndicator;
  legs?: OrderLegRequest[];
}

export interface PlaceOrderResponse {
  orderId: string;
}

export async function placeOrder(
  accountId: string,
  request: PlaceOrderRequest
): Promise<PlaceOrderResponse> {
  return authenticatedFetch<PlaceOrderResponse>(
    `userapigateway/trading/${encodeURIComponent(accountId)}/order`,
    {
      method: 'POST',
      body: request,
    }
  );
}

export type OrderStatus =
  | 'NEW'
  | 'PENDING'
  | 'OPEN'
  | 'FILLED'
  | 'PARTIALLY_FILLED'
  | 'CANCELLED'
  | 'REJECTED'
  | 'EXPIRED';

export interface OrderDetails {
  orderId: string;
  instrument: InstrumentInfo;
  createdAt: string;
  type: OrderType;
  side: OrderSide;
  status: OrderStatus;
  quantity?: string;
  notionalValue?: string;
  expiration: OrderExpiration;
  limitPrice?: string;
  stopPrice?: string;
  closedAt?: string;
  openCloseIndicator?: OpenCloseIndicator;
  filledQuantity?: string;
  averagePrice?: string;
  legs?: Array<{
    instrument: InstrumentInfo;
    side: OrderSide;
    openCloseIndicator?: OpenCloseIndicator;
    ratioQuantity?: number;
  }>;
  rejectReason?: string;
}

export async function getOrder(
  accountId: string,
  orderId: string
): Promise<OrderDetails> {
  try {
    return await authenticatedFetch<OrderDetails>(
      `userapigateway/trading/${encodeURIComponent(accountId)}/order/${encodeURIComponent(orderId)}`
    );
  } catch (err) {
    if (err instanceof ApiError && err.statusCode === 404) {
      throw new NotFoundError(
        `Order '${orderId}' not found. It may not be indexed yet.`
      );
    }
    throw err;
  }
}

export async function cancelOrder(
  accountId: string,
  orderId: string
): Promise<void> {
  try {
    await authenticatedFetch<void>(
      `userapigateway/trading/${encodeURIComponent(accountId)}/order/${encodeURIComponent(orderId)}`,
      { method: 'DELETE' }
    );
  } catch (err) {
    if (err instanceof ApiError && err.statusCode === 404) {
      throw new NotFoundError(`Order '${orderId}' not found`);
    }
    throw err;
  }
}
