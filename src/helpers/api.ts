import {
  authenticatedFetch,
  validateApiKey,
  clearTokens,
  ApiError,
  AuthenticationError,
  RateLimitError,
} from './fetch.js';

export {
  validateApiKey,
  clearTokens,
  ApiError,
  AuthenticationError,
  RateLimitError,
};

export interface Account {
  accountId: string;
  accountType: string;
  optionsLevel: string;
  brokerageAccountType: string;
  tradePermissions: string;
}

export interface AccountsResponse {
  accounts: Account[];
}

export async function getAccounts(): Promise<AccountsResponse> {
  return authenticatedFetch<AccountsResponse>('userapigateway/trading/account');
}

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

export interface Instrument {
  symbol: string;
  name?: string;
  type: string;
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

export interface Transaction {
  timestamp: string;
  id: string;
  type: string;
  subType: string;
  accountNumber: string;
  symbol?: string;
  securityType?: string;
  side?: string;
  description: string;
  netAmount: string;
  principalAmount?: string;
  quantity?: string;
  direction: string;
  fees?: string;
}

export interface HistoryResponse {
  transactions: Transaction[];
  nextToken?: string;
  start: string;
  end: string;
  pageSize: number;
}

export interface HistoryOptions {
  start?: string;
  end?: string;
  pageSize?: number;
  nextToken?: string;
}

export async function getHistory(
  accountId: string,
  options: HistoryOptions = {}
): Promise<HistoryResponse> {
  const params = new URLSearchParams();

  if (options.start) {
    params.set('start', options.start);
  }
  if (options.end) {
    params.set('end', options.end);
  }
  if (options.pageSize) {
    params.set('pageSize', options.pageSize.toString());
  }
  if (options.nextToken) {
    params.set('nextToken', options.nextToken);
  }

  const queryString = params.toString();
  const path = `userapigateway/trading/${encodeURIComponent(accountId)}/history${queryString ? `?${queryString}` : ''}`;

  try {
    return await authenticatedFetch<HistoryResponse>(path);
  } catch (err) {
    if (err instanceof ApiError && err.statusCode === 404) {
      throw new NotFoundError(`Account '${accountId}' not found`);
    }
    throw err;
  }
}

export type SecurityType =
  | 'EQUITY'
  | 'ETF'
  | 'ADR'
  | 'CRYPTO'
  | 'OPTION'
  | 'MULTI_LEG_INSTRUMENT'
  | 'ALT'
  | 'TREASURY'
  | 'BOND'
  | 'INDEX';

export type TradingStatus =
  | 'BUY_AND_SELL'
  | 'BUY_ONLY'
  | 'SELL_ONLY'
  | 'LIQUIDATION_ONLY'
  | 'DISABLED'
  | 'NONE';

export interface InstrumentInfo {
  symbol: string;
  type: SecurityType;
}

export interface InstrumentEntry {
  instrument: InstrumentInfo;
  trading: TradingStatus;
  fractionalTrading: TradingStatus;
  optionTrading: TradingStatus;
  optionSpreadTrading: TradingStatus;
  instrumentDetails: unknown;
}

export interface InstrumentsResponse {
  instruments: InstrumentEntry[];
}

export interface InstrumentsOptions {
  typeFilter?: SecurityType[];
  tradingFilter?: TradingStatus[];
  fractionalTradingFilter?: TradingStatus[];
  optionTradingFilter?: TradingStatus[];
  optionSpreadTradingFilter?: TradingStatus[];
}

export async function getInstruments(
  options: InstrumentsOptions = {}
): Promise<InstrumentsResponse> {
  const params = new URLSearchParams();

  if (options.typeFilter?.length) {
    for (const type of options.typeFilter) {
      params.append('typeFilter', type);
    }
  }
  if (options.tradingFilter?.length) {
    for (const status of options.tradingFilter) {
      params.append('tradingFilter', status);
    }
  }
  if (options.fractionalTradingFilter?.length) {
    for (const status of options.fractionalTradingFilter) {
      params.append('fractionalTradingFilter', status);
    }
  }
  if (options.optionTradingFilter?.length) {
    for (const status of options.optionTradingFilter) {
      params.append('optionTradingFilter', status);
    }
  }
  if (options.optionSpreadTradingFilter?.length) {
    for (const status of options.optionSpreadTradingFilter) {
      params.append('optionSpreadTradingFilter', status);
    }
  }

  const queryString = params.toString();
  const path = `userapigateway/trading/instruments${queryString ? `?${queryString}` : ''}`;

  return authenticatedFetch<InstrumentsResponse>(path);
}

export async function getInstrument(
  symbol: string,
  type: SecurityType
): Promise<InstrumentEntry> {
  const path = `userapigateway/trading/instruments/${encodeURIComponent(symbol)}/${encodeURIComponent(type)}`;

  try {
    return await authenticatedFetch<InstrumentEntry>(path);
  } catch (err) {
    if (err instanceof ApiError && err.statusCode === 404) {
      throw new NotFoundError(`Instrument '${symbol}' (${type}) not found`);
    }
    throw err;
  }
}
