/**
 * Base error classes
 */

import type { ContentfulStatusCode } from 'hono/utils/http-status';

/**
 * Base application error class
 * All custom errors should extend this
 */
export class AppError extends Error {
  constructor(
    public statusCode: ContentfulStatusCode,
    message: string,
    public isOperational = true,
    public details?: unknown
  ) {
    super(message);
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}
