/**
 * Redis operation error classes
 */

import { AppError } from './base';

/**
 * Redis connection failed
 */
export class RedisConnectionError extends AppError {
  constructor(message = 'Failed to connect to Redis') {
    super(503, message); // Service Unavailable
  }
}

/**
 * Redis operation timed out
 */
export class RedisTimeoutError extends AppError {
  constructor(message = 'Redis operation timed out') {
    super(504, message); // Gateway Timeout
  }
}

/**
 * Generic Redis operation failed
 */
export class RedisOperationError extends AppError {
  constructor(message = 'Redis operation failed') {
    super(500, message);
  }
}

/**
 * Token not found or expired in Redis
 */
export class TokenNotFoundError extends AppError {
  constructor(message = 'Token not found or expired') {
    super(404, message);
  }
}

/**
 * Token already exists (duplicate)
 */
export class TokenAlreadyExistsError extends AppError {
  constructor(message = 'Token already exists') {
    super(409, message); // Conflict
  }
}

/**
 * Rate limit exceeded
 */
export class RateLimitExceededError extends AppError {
  public retryAfter?: number;

  constructor(message = 'Rate limit exceeded', retryAfter?: number) {
    super(429, message); // Too Many Requests
    this.retryAfter = retryAfter;
  }
}

/**
 * Session has expired in Redis
 */
export class SessionExpiredError extends AppError {
  constructor(message = 'Session has expired') {
    super(401, message);
  }
}

/**
 * Session not found in Redis
 */
export class RedisSessionNotFoundError extends AppError {
  constructor(message = 'Session not found') {
    super(404, message);
  }
}
