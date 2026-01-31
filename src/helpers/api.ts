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
