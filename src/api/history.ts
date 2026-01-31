import { authenticatedFetch, ApiError } from '../helpers/fetch.js';
import { NotFoundError } from './portfolio.js';

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
