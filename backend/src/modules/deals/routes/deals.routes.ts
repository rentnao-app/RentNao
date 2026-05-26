import { createRoute, z } from '@hono/zod-openapi';

export const generateRentDeedRoute = createRoute({
  method: 'post',
  path: '/{dealId}/rent-deed',
  tags: ['Deals'],
  summary: 'Generate Rent Deed for a Deal',
  description: 'Generates a PDF rent deed, uploads to S3, and notifies the tenant',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      dealId: z.string().openapi({ example: 'deal_123' }),
    }),
  },
  responses: {
    201: {
      description: 'Rent deed generated and sent successfully',
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            data: z.object({
              pdfUrl: z.string().url(),
            }),
          }),
        },
      },
    },
    403: { description: 'Forbidden' },
    404: { description: 'Deal not found' },
  },
});
