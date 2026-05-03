import { createRoute, z } from '@hono/zod-openapi';
import {
  createTestimonialSchema,
  testimonialListResponseSchema,
  testimonialResponseSchema,
  getTestimonialsQuerySchema,
  testimonialStatusSchema,
} from '../schemas';

const errorResponseSchema = z.object({
  success: z.boolean().openapi({ example: false }),
  error: z.string(),
});

export const listTestimonialsRoute = createRoute({
  method: 'get',
  path: '/',
  tags: ['Testimonials'],
  summary: 'List approved testimonials',
  description: 'Fetch all approved testimonials for public display.',
  request: {
    query: getTestimonialsQuerySchema,
  },
  responses: {
    200: {
      description: 'Testimonials fetched',
      content: {
        'application/json': {
          schema: testimonialListResponseSchema,
        },
      },
    },
  },
});

export const createTestimonialRoute = createRoute({
  method: 'post',
  path: '/',
  tags: ['Testimonials'],
  summary: 'Submit a testimonial',
  description: 'Submit a new testimonial for review.',
  request: {
    body: {
      content: {
        'application/json': {
          schema: createTestimonialSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Testimonial submitted',
      content: {
        'application/json': {
          schema: testimonialResponseSchema,
        },
      },
    },
    200: {
      description: 'Testimonial updated (upsert)',
      content: {
        'application/json': {
          schema: testimonialResponseSchema,
        },
      },
    },
    400: {
      description: 'Invalid input',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
    403: {
      description: 'Forbidden - User must be active and KYC verified',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
  },
  security: [{ bearerAuth: [] }],
});

export const listAllTestimonialsAdminRoute = createRoute({
  method: 'get',
  path: '/admin',
  tags: ['Admin - Testimonials'],
  summary: 'List all testimonials (Admin)',
  responses: {
    200: {
      description: 'All testimonials fetched',
      content: {
        'application/json': {
          schema: testimonialListResponseSchema,
        },
      },
    },
    403: {
      description: 'Forbidden',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
  },
  security: [{ bearerAuth: [] }],
});

export const updateTestimonialStatusRoute = createRoute({
  method: 'patch',
  path: '/{id}/status',
  tags: ['Admin - Testimonials'],
  summary: 'Update testimonial status',
  request: {
    params: z.object({
      id: z.string(),
    }),
    body: {
      content: {
        'application/json': {
          schema: z.object({
            status: testimonialStatusSchema,
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Status updated',
      content: {
        'application/json': {
          schema: testimonialResponseSchema,
        },
      },
    },
    404: {
      description: 'Testimonial not found',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
  },
  security: [{ bearerAuth: [] }],
});
