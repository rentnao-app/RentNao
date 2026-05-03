import type { OpenAPIHono } from '@hono/zod-openapi';
import { AppError } from '@/errors/base';
import {
  listTestimonialsRoute,
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

export function registerPrivateTestimonialRoutes(app: OpenAPIHono) {
  app.openapi(createTestimonialRoute, async (c) => {
    const body = c.req.valid('json');
    const user = c.get('user' as any);
    
    const userId = user.userId;
    
    const { data, isUpsert } = await testimonialService.submitTestimonial(userId, body);
    return c.json({ success: true, data }, isUpsert ? 200 : 201);
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
    const data = await testimonialService.updateTestimonialStatus(id, status);
    return c.json({ success: true, data }, 200);
  });
}
