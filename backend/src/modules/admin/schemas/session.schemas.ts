import { z } from '@hono/zod-openapi';

const sessionSchema = z.object({
  id: z.string(),
  sessionToken: z.string(),
  expiresAt: z.iso.datetime(),
  ipAddress: z.string().nullable(),
  userAgent: z.string().nullable(),
  lastActivity: z.iso.datetime(),
  createdAt: z.iso.datetime(),
});

export const sessionListResponseSchema = z.object({
  success: z.boolean().openapi({ example: true }),
  data: z.object({
    sessions: z.array(sessionSchema),
  }),
});
