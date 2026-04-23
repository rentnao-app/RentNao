/**
 * Authentication and authorization error classes
 */

import { AppError } from './base';

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(401, message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Access forbidden') {
    super(403, message);
  }
}

export class TokenExpiredError extends AppError {
  constructor(message = 'Token has expired. Please login again.') {
    super(401, message);
  }
}

export class InvalidTokenError extends AppError {
  constructor(message = 'Invalid token. Please login again.') {
    super(401, message);
  }
}

export class InvalidCredentialsError extends AppError {
  constructor(message = 'Invalid credentials') {
    super(401, message);
  }
}
