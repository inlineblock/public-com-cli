// Re-export everything from the api module for backwards compatibility
export * from '../api/index.js';

// Re-export auth helpers from fetch
export {
  validateApiKey,
  clearTokens,
  ApiError,
  AuthenticationError,
  RateLimitError,
} from './fetch.js';
