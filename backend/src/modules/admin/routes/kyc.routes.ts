import { createRoute, z } from '@hono/zod-openapi';
import {
  kycSubmissionsQuerySchema,
  kycSubmissionsListResponseSchema,
  kycSubmissionDetailResponseSchema,
  reviewKycSubmissionSchema,
  reviewKycResponseSchema,
  errorResponseSchema,
} from '../schemas';

export const listKycSubmissionsRoute = createRoute({
  method: 'get',
  path: '/kyc/submissions',
  tags: ['Admin - KYC Review'],
  summary: 'List KYC verification submissions',
  description: 'Get paginated list of KYC submissions pending or completed review',
  request: { query: kycSubmissionsQuerySchema },
  responses: {
    200: {
      description: 'Submissions retrieved successfully',
      content: { 'application/json': { schema: kycSubmissionsListResponseSchema } },
    },
    403: {
      description: 'Forbidden - Admin access required',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
  },
  security: [{ bearerAuth: [] }],
});

export const getKycSubmissionDetailRoute = createRoute({
  method: 'get',
  path: '/kyc/submissions/{submissionId}',
  tags: ['Admin - KYC Review'],
  summary: 'Get KYC submission details',
  description: 'Get full details of a KYC submission including all documents',
  request: {
    params: z.object({
      submissionId: z.string().openapi({
        param: { name: 'submissionId', in: 'path' },
        example: 'cm4submission123xyz',
      }),
    }),
  },
  responses: {
    200: { description: 'Submission details retrieved', content: { 'application/json': { schema: kycSubmissionDetailResponseSchema } } },
    404: { description: 'Submission not found', content: { 'application/json': { schema: errorResponseSchema } } },
    403: { description: 'Forbidden - Admin access required', content: { 'application/json': { schema: errorResponseSchema } } },
  },
  security: [{ bearerAuth: [] }],
});

export const reviewKycSubmissionRoute = createRoute({
  method: 'patch',
  path: '/kyc/submissions/{submissionId}/review',
  tags: ['Admin - KYC Review'],
  summary: 'Review and approve/reject KYC submission',
  description: 'Approve or reject a KYC verification submission',
  request: {
    params: z.object({
      submissionId: z.string().openapi({
        param: { name: 'submissionId', in: 'path' },
        example: 'cm4submission123xyz',
      }),
    }),
    body: {
      content: {
        'application/json': {
          schema: reviewKycSubmissionSchema,
        },
      },
    },
  },
  responses: {
    200: { description: 'KYC submission reviewed successfully', content: { 'application/json': { schema: reviewKycResponseSchema } } },
    400: { description: 'Invalid request or missing rejection reason', content: { 'application/json': { schema: errorResponseSchema } } },
    404: { description: 'Submission not found', content: { 'application/json': { schema: errorResponseSchema } } },
    403: { description: 'Forbidden - Admin access required', content: { 'application/json': { schema: errorResponseSchema } } },
  },
  security: [{ bearerAuth: [] }],
});
