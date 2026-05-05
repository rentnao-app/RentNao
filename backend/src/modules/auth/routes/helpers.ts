/**
 * Route helper utilities
 * Reduces boilerplate for common response patterns
 */

import { errorResponseSchema } from '../schemas';

/**
 * Creates a standard error response for a given status code
 */
export const errorResponse = (status: number, description: string) => ({
  [status]: {
    description,
    content: {
      'application/json': {
        schema: errorResponseSchema,
      },
    },
  },
});

/**
 * Common error responses used across routes
 */
export const commonErrors = {
  badRequest: errorResponse(400, 'Invalid request body'),
  unauthorized: errorResponse(401, 'Unauthorized or invalid credentials'),
  forbidden: errorResponse(403, 'Account inactive or access forbidden'),
  notFound: errorResponse(404, 'Resource not found'),
  conflict: errorResponse(409, 'Resource already exists or conflict'),
  gone: errorResponse(410, 'Resource expired or no longer available'),
  tooManyRequests: errorResponse(429, 'Too many requests'),
  internalError: errorResponse(500, 'Internal server error'),
};

