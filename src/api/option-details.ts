import { authenticatedFetch } from '../helpers/fetch.js';

export interface Greeks {
  delta?: string;
  gamma?: string;
  theta?: string;
  vega?: string;
  rho?: string;
  impliedVolatility?: string;
}

export interface OptionGreek {
  symbol: string;
  greeks: Greeks;
}

export interface OptionGreeksResponse {
  greeks: OptionGreek[];
}

export async function getOptionGreeks(
  accountId: string,
  osiSymbols: string[]
): Promise<OptionGreeksResponse> {
  const params = new URLSearchParams();
  for (const symbol of osiSymbols) {
    params.append('osiSymbols', symbol);
  }

  return authenticatedFetch<OptionGreeksResponse>(
    `userapigateway/option-details/${encodeURIComponent(accountId)}/greeks?${params.toString()}`
  );
}
