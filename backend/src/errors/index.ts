/**
 * Centralized error exports
 */

// Base errors
export { AppError } from './base';

// Auth errors
export {
  UnauthorizedError,
  ForbiddenError,
  TokenExpiredError,
  InvalidTokenError,
  InvalidCredentialsError,
} from './auth';

// Admin errors
export {
  UserNotFoundError,
  SessionNotFoundError,
  CannotModifyOwnAccountError,
  UserAlreadyDeletedError,
  UserNotDeletedError,
} from './admin';

// Redis errors
export {
  RedisConnectionError,
  RedisTimeoutError,
  RedisOperationError,
  TokenNotFoundError,
  TokenAlreadyExistsError,
  RateLimitExceededError,
  SessionExpiredError,
  RedisSessionNotFoundError,
} from './redis';

// Error handlers
export { handleDatabaseError } from './database';
export { handleValidationError } from './validation';
