/**
 * Standardized API response helpers
 */

import type { Context } from 'hono';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  errors?: Array<{ field: string; message: string }>;
  message?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export const success = <T>(c: Context, data: T, message?: string, statusCode = 200) => {
  return c.json<ApiResponse<T>>(
    {
      success: true,
      data,
      message,
    },
    statusCode as any
  );
};

export const error = (c: Context, message: string, statusCode = 400) => {
  return c.json<ApiResponse>(
    {
      success: false,
      error: message,
    },
    statusCode as any
  );
};

export const validationError = (
  c: Context,
  errors: Array<{ field: string; message: string }>,
  message = 'Validation failed'
) => {
  return c.json<ApiResponse>(
    {
      success: false,
      error: message,
      errors,
    },
    400
  );
};

export const paginated = <T>(
  c: Context,
  data: T[],
  page: number,
  limit: number,
  total: number
) => {
  return c.json<ApiResponse<T[]>>(
    {
      success: true,
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    },
    200
  );
};
