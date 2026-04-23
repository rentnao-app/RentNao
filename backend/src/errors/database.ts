/**
 * Database error handler
 * Maps PostgreSQL errors to HTTP responses
 */

import type { Context } from 'hono';
import { DatabaseError } from 'pg';

/**
 * Handle PostgreSQL errors and map to HTTP responses
 */
export const handleDatabaseError = (err: any, c: Context) => {
  if (!(err instanceof DatabaseError)) {
    return null;
  }

  console.error('[Database Error]', err.code, err.message, err.detail);

  switch (err.code) {
    case '23505': // unique_violation
      return c.json(
        {
          success: false,
          error: 'A record with this value already exists',
          statusCode: 409,
        },
        409
      );

    case '23503': // foreign_key_violation
      return c.json(
        {
          success: false,
          error: 'Related record not found',
          statusCode: 400,
        },
        400
      );

    case '23502': // not_null_violation
      return c.json(
        {
          success: false,
          error: 'Required field is missing',
          statusCode: 400,
        },
        400
      );

    case '22P02': // invalid_text_representation
    case '22003': // numeric_value_out_of_range
      return c.json(
        {
          success: false,
          error: 'Invalid data format',
          statusCode: 400,
        },
        400
      );

    case '08006': // connection_failure
    case '08003': // connection_does_not_exist
      return c.json(
        {
          success: false,
          error: 'Database connection failed',
          statusCode: 503,
        },
        503
      );

    default:
      return c.json(
        {
          success: false,
          error: 'Database operation failed',
          statusCode: 400,
        },
        400
      );
  }
};
