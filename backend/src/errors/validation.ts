/**
 * Validation error handler
 * Handles Zod validation errors
 */

import type { Context } from 'hono';
import { ZodError } from 'zod';

/**
 * Handle Zod validation errors and format response
 */
export const handleValidationError = (err: any, c: Context) => {
  if (!(err instanceof ZodError)) {
    return null;
  }

  const errors = err.issues.map((e) => ({
    field: e.path.join('.'),
    message: e.message,
  }));

  return c.json(
    {
      success: false,
      error: 'Validation failed',
      errors: errors,
      statusCode: 400,
    },
    400
  );
};
