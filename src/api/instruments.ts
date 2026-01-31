import { authenticatedFetch, ApiError } from '../helpers/fetch.js';
import { SecurityType, TradingStatus, InstrumentInfo } from './types.js';
import { NotFoundError } from './portfolio.js';

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
