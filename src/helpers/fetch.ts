import { getEndpoint } from './config.js';
import { getApiKey } from '../authentication/keychain.js';
import {
  getToken,
  storeToken,
  isTokenExpired,
  deleteToken,
} from '../authentication/token.js';

const TOKEN_VALIDITY_MINUTES = 120;
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 2000;
const MAX_TOTAL_RETRY_TIME_MS = 30000;

let globalRetryEnabled = true;

export function setRetryEnabled(enabled: boolean): void {
  globalRetryEnabled = enabled;
}

export function isRetryEnabled(): boolean {
  return globalRetryEnabled;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class RateLimitError extends ApiError {
  constructor(
    message: string,
    public retryAfterMs?: number
  ) {
    super(message, 429, true);
    this.name = 'RateLimitError';
  }
}

export class AuthenticationError extends ApiError {
  constructor(message: string) {
    super(message, 401, false);
    this.name = 'AuthenticationError';
  }
}

interface TokenResponse {
  accessToken: string;
}

interface ApiErrorBody {
  message?: string;
  error?: string;
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function calculateBackoffDelay(attempt: number): number {
  const delay = BASE_DELAY_MS * Math.pow(2, attempt);
  const jitter = Math.random() * 1000;
  return Math.min(delay + jitter, MAX_TOTAL_RETRY_TIME_MS / 2);
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
      const errorBody = (await response.json()) as ApiErrorBody;
      errorMessage = errorBody.message || errorBody.error || errorMessage;
    } catch {
      // Ignore JSON parse errors
    }

    if (response.status === 401 || response.status === 403) {
      throw new AuthenticationError('Invalid API key');
    }

    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After');
      const retryAfterMs = retryAfter ? parseInt(retryAfter, 10) * 1000 : 5000;
      throw new RateLimitError(
        'Rate limited while fetching token',
        retryAfterMs
      );
    }

    if (response.status >= 500) {
      throw new ApiError(
        `Server error while fetching token: ${errorMessage}`,
        response.status,
        true
      );
    }

    throw new ApiError(
      `Failed to get access token: ${errorMessage}`,
      response.status
    );
  }

  const data = (await response.json()) as TokenResponse;
  return data.accessToken;
}

async function getValidAccessToken(forceRefresh = false): Promise<string> {
  const apiKey = await getApiKey();

  if (!apiKey) {
    throw new AuthenticationError(
      'No API key configured. Run "public-cli auth login" first.'
    );
  }

  if (!forceRefresh) {
    const existingToken = await getToken();
    if (existingToken && !isTokenExpired(existingToken.expiresAt)) {
      return existingToken.accessToken;
    }
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

export interface FetchOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: unknown;
  headers?: Record<string, string>;
  skipRetry?: boolean;
}

export async function authenticatedFetch<T>(
  path: string,
  options: FetchOptions = {}
): Promise<T> {
  const { method = 'GET', body, headers = {}, skipRetry = false } = options;

  const endpoint = await getEndpoint();
  const url = new URL(path, endpoint).toString();

  const shouldRetry = globalRetryEnabled && !skipRetry;
  let lastError: Error | null = null;
  let tokenRefreshed = false;

  for (let attempt = 0; attempt <= (shouldRetry ? MAX_RETRIES : 0); attempt++) {
    try {
      const accessToken = await getValidAccessToken(tokenRefreshed);

      const requestHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
        ...headers,
      };

      const requestOptions: RequestInit = {
        method,
        headers: requestHeaders,
      };

      if (body !== undefined) {
        requestOptions.body = JSON.stringify(body);
      }

      const response = await fetch(url, requestOptions);

      if (response.ok) {
        return (await response.json()) as T;
      }

      let errorMessage = `HTTP ${response.status}`;
      try {
        const errorBody = (await response.json()) as ApiErrorBody;
        errorMessage = errorBody.message || errorBody.error || errorMessage;
      } catch {
        // Ignore JSON parse errors
      }

      if (response.status === 401) {
        if (!tokenRefreshed) {
          await clearTokens();
          tokenRefreshed = true;
          continue;
        }
        throw new AuthenticationError(
          'Authentication failed. Please run "public-cli auth login" again.'
        );
      }

      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        const retryAfterMs = retryAfter
          ? parseInt(retryAfter, 10) * 1000
          : calculateBackoffDelay(attempt);

        if (shouldRetry && attempt < MAX_RETRIES) {
          await sleep(retryAfterMs);
          continue;
        }

        throw new RateLimitError(
          'Too many requests. Please try again later.',
          retryAfterMs
        );
      }

      if (response.status >= 500) {
        const error = new ApiError(
          `Server error: ${errorMessage}`,
          response.status,
          true
        );

        if (shouldRetry && attempt < MAX_RETRIES) {
          lastError = error;
          const delay = calculateBackoffDelay(attempt);
          await sleep(delay);
          continue;
        }

        throw error;
      }

      throw new ApiError(errorMessage, response.status);
    } catch (err) {
      if (
        err instanceof AuthenticationError ||
        err instanceof RateLimitError ||
        (err instanceof ApiError && !err.retryable)
      ) {
        throw err;
      }

      if (err instanceof ApiError && err.retryable) {
        lastError = err;
        if (shouldRetry && attempt < MAX_RETRIES) {
          const delay = calculateBackoffDelay(attempt);
          await sleep(delay);
          continue;
        }
        throw err;
      }

      if (err instanceof Error) {
        lastError = err;
        if (shouldRetry && attempt < MAX_RETRIES) {
          const delay = calculateBackoffDelay(attempt);
          await sleep(delay);
          continue;
        }
      }

      throw err;
    }
  }

  throw lastError || new ApiError('Request failed after retries');
}
