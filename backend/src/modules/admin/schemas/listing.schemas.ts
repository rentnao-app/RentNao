import { z } from '@hono/zod-openapi';
import { PropertyType } from '@/types/enums';

export const updateAdminPropertyTypeSchema = z.object({
  propertyType: PropertyType.openapi({
    example: 'APARTMENT',
    description: 'Property type to set on the listing\'s property',
  }),
});

export type UpdateAdminPropertyTypeInput = z.infer<typeof updateAdminPropertyTypeSchema>;

export const updateAdminPropertyTypeResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    listingId: z.string(),
    propertyId: z.string(),
    propertyType: PropertyType,
  }),
  message: z.string(),
});
