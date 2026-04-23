/**
 * Global error handler
 * Delegates to specific error handlers based on error type
 */

import type { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { AppError, handleDatabaseError, handleValidationError } from '@/errors';

export { AppError } from '@/errors';

export const errorHandler = (err: Error, c: Context) => {
  // Handle Zod validation errors
  const validationError = handleValidationError(err, c);
  if (validationError) return validationError;

  // Handle Hono HTTPException
  if (err instanceof HTTPException) {
    return c.json(
      {
        success: false,
        error: err.message,
        statusCode: err.status,
      },
      err.status
    );
  }

  // Handle custom AppError and its subclasses
  if (err instanceof AppError) {
    const details = (err as AppError).details;
    return c.json(
      {
        success: false,
        error: err.message,
        statusCode: err.statusCode,
        ...(details ? { details } : {}),
      },
      err.statusCode
    );
  }

  // Handle PostgreSQL errors
  const dbError = handleDatabaseError(err, c);
  if (dbError) return dbError;

  // Unknown errors
  console.error('[Global Handler] Unhandled Error:', err);
  
  return c.json(
    {
      success: false,
      error: 'Internal server error',
      statusCode: 500,
    },
    500
  );
};
