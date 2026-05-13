import { OpenAPIHono } from '@hono/zod-openapi';
import { defaultValidationHook } from '@/config/openapi';
import { requireAuth, requireRole } from '@/security';
import { 
  registerPublicTestimonialRoutes, 
  registerPrivateTestimonialRoutes,
  registerAdminTestimonialRoutes
} from './controllers/testimonial.controller';

const testimonials = new OpenAPIHono({
  defaultHook: defaultValidationHook,
});

// 1. Public Routes (No authentication required)
registerPublicTestimonialRoutes(testimonials);

// 2. Authentication Middleware
// This will intercept all subsequent route registrations
testimonials.use('*', requireAuth);

// 3. Private Routes (Require valid JWT)
registerPrivateTestimonialRoutes(testimonials);

// 4. Admin Firewall
testimonials.use('*', requireRole('ADMIN'));

// 5. Admin Routes
registerAdminTestimonialRoutes(testimonials);

export default testimonials;
