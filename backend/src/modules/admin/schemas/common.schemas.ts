import { z } from '@hono/zod-openapi';

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1).openapi({
    example: 1,
    description: 'Page number (1-indexed)',
  }),
  limit: z.coerce.number().int().min(1).max(100).optional().default(10).openapi({
    example: 10,
    description: 'Items per page (max 100)',
  }),
});

export const userIdParamSchema = z.object({
  userId: z.string().min(1).openapi({
    example: 'cm4abc123xyz',
    description: 'User ID',
  }),
});

export const sessionIdParamSchema = z.object({
  sessionId: z.string().min(1).openapi({
    example: 'cm4session123',
    description: 'Session ID',
  }),
});

export const errorResponseSchema = z.object({
  success: z.boolean().openapi({ example: false }),
  error: z.string().openapi({ example: 'Operation failed' }),
});

export const successMessageResponseSchema = z.object({
  success: z.boolean().openapi({ example: true }),
  message: z.string().openapi({ example: 'Operation completed successfully' }),
});

export type UserIdParam = z.infer<typeof userIdParamSchema>;
export type SessionIdParam = z.infer<typeof sessionIdParamSchema>;
