import { authenticatedFetch } from '../helpers/fetch.js';
import { InstrumentInfo } from './types.js';

export type QuoteSecurityType = 'EQUITY' | 'OPTION' | 'CRYPTO' | 'INDEX';

export interface QuoteInstrument {
  symbol: string;
  type: QuoteSecurityType;
}

export interface Quote {
  instrument: InstrumentInfo;
  outcome: 'SUCCESS' | 'FAILURE';
  last?: string;
  lastTimestamp?: string;
  bid?: string;
  bidSize?: number;
  ask?: string;
  askSize?: number;
  volume?: number;
  openInterest?: number;
}

export interface QuotesResponse {
  quotes: Quote[];
}

export async function getQuotes(
  accountId: string,
  instruments: QuoteInstrument[]
): Promise<QuotesResponse> {
  return authenticatedFetch<QuotesResponse>(
    `userapigateway/marketdata/${encodeURIComponent(accountId)}/quotes`,
    {
      method: 'POST',
      body: { instruments },
    }
  );
}

export type OptionUnderlyingType =
  | 'EQUITY'
  | 'UNDERLYING_SECURITY_FOR_INDEX_OPTION';

export interface OptionUnderlyingInstrument {
  symbol: string;
  type: OptionUnderlyingType;
}

export interface OptionExpirationsResponse {
  baseSymbol: string;
  expirations: string[];
}

export async function getOptionExpirations(
  accountId: string,
  instrument: OptionUnderlyingInstrument
): Promise<OptionExpirationsResponse> {
  return authenticatedFetch<OptionExpirationsResponse>(
    `userapigateway/marketdata/${encodeURIComponent(accountId)}/option-expirations`,
    {
      method: 'POST',
      body: { instrument },
    }
  );
}

export interface OptionQuote {
  instrument: InstrumentInfo;
  outcome: 'SUCCESS' | 'FAILURE';
  last?: string;
  bid?: string;
  ask?: string;
  volume?: number;
  openInterest?: number;
}

export interface OptionChainResponse {
  baseSymbol: string;
  calls: OptionQuote[];
  puts: OptionQuote[];
}

export async function getOptionChain(
  accountId: string,
  instrument: OptionUnderlyingInstrument,
  expirationDate: string
): Promise<OptionChainResponse> {
  return authenticatedFetch<OptionChainResponse>(
    `userapigateway/marketdata/${encodeURIComponent(accountId)}/option-chain`,
    {
      method: 'POST',
      body: { instrument, expirationDate },
    }
  );
}
