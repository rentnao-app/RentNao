import { z } from '@hono/zod-openapi';

export const testimonialStatusSchema = z.enum(['PENDING', 'FLAGGED', 'APPROVED', 'REJECTED', 'ARCHIVED']).openapi({ example: 'APPROVED' });

export const testimonialSchema = z.object({
  id: z.string().openapi({ example: 'cuid123' }),
  userId: z.string().openapi({ example: 'user123' }),
  content: z.string().openapi({ example: 'Great platform! Found a house in 2 days.' }),
  rating: z.number().int().min(1).max(5).openapi({ example: 5 }),
  isFeatured: z.boolean().openapi({ example: true }),
  status: testimonialStatusSchema.default('PENDING'),
  createdAt: z.string().openapi({ example: '2023-01-01T00:00:00Z' }),
  updatedAt: z.string().datetime().nullable(),
  user: z.object({
    displayName: z.string().openapi({ example: 'John Doe' }),
    avatarUrl: z.string().nullable().openapi({ example: 'https://example.com/avatar.jpg' }),
    isActive: z.boolean().optional().openapi({ example: true }),
  }),
});

export const createTestimonialSchema = z.object({
  content: z.string().min(10, "Content must be at least 10 characters").max(1000, "Content must be at most 1000 characters").openapi({ example: 'Great platform! Found a house in 2 days.' }),
  rating: z.number().int().min(1).max(5).openapi({ example: 5 }),
});

export const getTestimonialsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1).openapi({ example: 1 }),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20).openapi({ example: 20 }),
});

export const testimonialResponseSchema = z.object({
  success: z.boolean().openapi({ example: true }),
  data: testimonialSchema,
});

export const testimonialListResponseSchema = z.object({
  success: z.boolean().openapi({ example: true }),
  data: z.array(testimonialSchema),
  pagination: z.object({
    total: z.number().openapi({ example: 1 }),
    page: z.number().openapi({ example: 1 }),
    limit: z.number().openapi({ example: 20 }),
    totalPages: z.number().openapi({ example: 1 }),
  }).optional(),
});

export const myTestimonialStatusResponseSchema = z.object({
  success: z.boolean().openapi({ example: true }),
  data: z.object({
    hasReview: z.boolean().openapi({ example: false }),
  }),
});

export const testimonialRatingDistributionSchema = z.object({
  stars: z.number().int().min(1).max(5),
  count: z.number().int().nonnegative(),
  percentage: z.number().min(0).max(100),
});

export const testimonialStatsResponseSchema = z.object({
  success: z.boolean().openapi({ example: true }),
  data: z.object({
    averageRating: z.number().min(0).max(5),
    totalReviews: z.number().int().nonnegative(),
    distribution: z.array(testimonialRatingDistributionSchema),
  }),
});

export type CreateTestimonialInput = z.infer<typeof createTestimonialSchema>;
export type GetTestimonialsQueryInput = z.infer<typeof getTestimonialsQuerySchema>;
