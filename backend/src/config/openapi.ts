/**
 * Default validation hook for OpenAPIHono
 * Formats Zod validation errors into a clean, readable format
 */

import type { Hook } from '@hono/zod-openapi';

export const defaultValidationHook: Hook<any, any, any, any> = (result, c) => {
  if (!result.success) {
    const flattenedErrors = result.error.issues.flatMap((issue: any) => {
      if (issue?.code !== 'invalid_union') {
        return [
          {
            field: issue.path?.join('.') || 'body',
            message: issue.message,
          },
        ];
      }

      const nestedGroups =
        issue.errors ||
        issue.unionErrors?.map((err: any) => err?.issues || []) ||
        [];

      const nestedIssues = nestedGroups.flat();

      if (nestedIssues.length === 0) {
        return [
          {
            field: 'body.role',
            message:
              'Payload does not match role-specific schema. For role=OWNER include ownerCategory; for role=TENANT include incomeRange, employmentStatus, familyStatus, and familySize.',
          },
        ];
      }

      return nestedIssues.map((nestedIssue: any) => ({
        field: nestedIssue.path?.join('.') || 'body',
        message: nestedIssue.message,
      }));
    });

    const dedupedErrors = flattenedErrors.filter(
      (err: { field: string; message: string }, index: number, self: Array<{ field: string; message: string }>) =>
        index === self.findIndex((e) => e.field === err.field && e.message === err.message)
    );

    return c.json(
      {
        success: false,
        error: 'Validation failed',
        errors: dedupedErrors,
      },
      400
    );
  }
};
