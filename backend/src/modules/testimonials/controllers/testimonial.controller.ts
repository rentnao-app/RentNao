import type { OpenAPIHono } from '@hono/zod-openapi';
import { AppError } from '@/errors/base';
import {
  listTestimonialsRoute,
  getMyTestimonialStatusRoute,
  createTestimonialRoute,
  listAllTestimonialsAdminRoute,
  updateTestimonialStatusRoute,
} from '../routes';
import * as testimonialService from '../services/testimonial.service';

export function registerPublicTestimonialRoutes(app: OpenAPIHono) {
  app.openapi(listTestimonialsRoute, async (c) => {
    const query = c.req.valid('query');
    const { items, pagination } = await testimonialService.listApprovedTestimonials(query);
    return c.json({ success: true, data: items, pagination }, 200);
  });
}

export function registerPrivateTestimonialRoutes(app: OpenAPIHono<any, any, any>) {
  app.openapi(getMyTestimonialStatusRoute, async (c: any) => {
    const user = c.get('user' as any);
    const userId = user?.userId;
    if (!userId) {
      return c.json({ success: false, error: 'User context missing' }, 401);
    }
    const hasReview = await testimonialService.hasUserSubmittedTestimonial(userId);
    return c.json({ success: true, data: { hasReview } }, 200);
  });

  app.openapi(createTestimonialRoute, async (c: any) => {
    const body = c.req.valid('json');
    const user = c.get('user' as any);
    const userId = user?.userId;

    if (!userId) {
      return c.json({ success: false, error: 'User context missing' }, 401);
    }
    
    const { data, isUpsert } = await testimonialService.submitTestimonial(userId, body);
    
    if (isUpsert) {
      return c.json({ success: true, data }, 200);
    }
    return c.json({ success: true, data }, 201);
  });
}

export function registerAdminTestimonialRoutes(app: OpenAPIHono) {
  app.openapi(listAllTestimonialsAdminRoute, async (c) => {
    const data = await testimonialService.listAllTestimonialsAdmin();
    return c.json({ success: true, data }, 200);
  });

  app.openapi(updateTestimonialStatusRoute, async (c) => {
    const { id } = c.req.valid('param');
    const { status } = c.req.valid('json');
    // Bridge Zod Enum to Prisma Enum with casting
    const data = await testimonialService.updateTestimonialStatus(id, status as any);
    return c.json({ success: true, data }, 200);
  });
}
