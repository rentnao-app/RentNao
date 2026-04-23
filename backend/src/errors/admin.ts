/**
 * Admin operation error classes
 */

import { AppError } from './base';

export class UserNotFoundError extends AppError {
  constructor(message = 'User not found') {
    super(404, message);
  }
}

export class SessionNotFoundError extends AppError {
  constructor(message = 'Session not found') {
    super(404, message);
  }
}

export class CannotModifyOwnAccountError extends AppError {
  constructor(operation: string = 'modify') {
    super(400, `Cannot ${operation} your own account`);
  }
}

export class UserAlreadyDeletedError extends AppError {
  constructor(message = 'User not found or already deleted') {
    super(404, message);
  }
}

export class UserNotDeletedError extends AppError {
  constructor(message = 'User not found or not deleted') {
    super(404, message);
  }
}
