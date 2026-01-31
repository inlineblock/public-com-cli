import { getEndpoint } from './config.js';
import { getApiKey } from '../authentication/keychain.js';
import {
  getToken,
  storeToken,
  isTokenExpired,
  deleteToken,
} from '../authentication/token.js';

const TOKEN_VALIDITY_MINUTES = 120;

interface TokenResponse {
  accessToken: string;
}

interface ApiError {
  message?: string;
  error?: string;
}

export class ApiClientError extends Error {
  constructor(
    message: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

async function fetchAccessToken(
  endpoint: string,
  secret: string
): Promise<string> {
  const url = new URL(
    'userapiauthservice/personal/access-tokens',
    endpoint
  ).toString();

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      validityInMinutes: TOKEN_VALIDITY_MINUTES,
      secret,
    }),
  });

  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}`;
    try {
      const errorBody = (await response.json()) as ApiError;
      errorMessage = errorBody.message || errorBody.error || errorMessage;
    } catch {
      // Ignore JSON parse errors
    }

    if (response.status === 401 || response.status === 403) {
      throw new ApiClientError('Invalid API key', response.status);
    }

    throw new ApiClientError(
      `Failed to get access token: ${errorMessage}`,
      response.status
    );
  }

  const data = (await response.json()) as TokenResponse;
  return data.accessToken;
}

export async function getValidAccessToken(): Promise<string> {
  const apiKey = await getApiKey();

  if (!apiKey) {
    throw new ApiClientError(
      'No API key configured. Run "public-cli auth login" first.'
    );
  }

  const existingToken = await getToken();

  if (existingToken && !isTokenExpired(existingToken.expiresAt)) {
    return existingToken.accessToken;
  }

  const endpoint = await getEndpoint();
  const accessToken = await fetchAccessToken(endpoint, apiKey);

  await storeToken(accessToken, TOKEN_VALIDITY_MINUTES);

  return accessToken;
}

export async function validateApiKey(apiKey: string): Promise<string> {
  const endpoint = await getEndpoint();
  const accessToken = await fetchAccessToken(endpoint, apiKey);

  await storeToken(accessToken, TOKEN_VALIDITY_MINUTES);

  return accessToken;
}

export async function clearTokens(): Promise<void> {
  await deleteToken();
}

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
  const accessToken = await getValidAccessToken();
  const endpoint = await getEndpoint();

  const url = new URL('userapigateway/trading/account', endpoint).toString();

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}`;
    try {
      const errorBody = (await response.json()) as ApiError;
      errorMessage = errorBody.message || errorBody.error || errorMessage;
    } catch {
      // Ignore JSON parse errors
    }

    if (response.status === 401) {
      await clearTokens();
      throw new ApiClientError(
        'Access token expired or invalid. Please try again.',
        response.status
      );
    }

    throw new ApiClientError(
      `Failed to fetch accounts: ${errorMessage}`,
      response.status
    );
  }

  return (await response.json()) as AccountsResponse;
}
