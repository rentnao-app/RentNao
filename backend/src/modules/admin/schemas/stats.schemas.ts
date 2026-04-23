import { z } from '@hono/zod-openapi';

const recentListingSchema = z.object({
  listingId: z.string(),
  title: z.string(),
  rent: z.number(),
  listingStatus: z.string(),
  createdAt: z.string(),
  areaName: z.string(),
  imageUrl: z.string().nullable(),
});

const recentPaymentSchema = z.object({
  id: z.string(),
  amount: z.number(),
  currency: z.string(),
  createdAt: z.string(),
  description: z.string().nullable(),
  type: z.string(),
  userLabel: z.string(),
});

const recentUserSchema = z.object({
  userId: z.string(),
  role: z.string(),
  contactEmail: z.string().nullable(),
  contactPhone: z.string().nullable(),
  kycVerificationStatus: z.string(),
  onboardingStatus: z.string(),
  createdAt: z.string(),
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
});

export const statsOverviewResponseSchema = z.object({
  success: z.boolean().openapi({ example: true }),
  data: z.object({
    usersByRole: z.object({
      TENANT: z.number(),
      OWNER: z.number(),
      ADMIN: z.number(),
    }),
    usersByOnboarding: z.object({
      AUTH_PENDING: z.number(),
      PROFILE_PENDING: z.number(),
      COMPLETED: z.number(),
    }),
    recentRegistrations: z.object({
      last7Days: z.number(),
      last30Days: z.number(),
    }),
    activeToday: z.number(),
    totalUsers: z.number(),
    totalListings: z.number(),
    totalEarningsBdt: z.number(),
    pendingVerificationCount: z.number(),
    activeListingsCount: z.number(),
    listingsCreatedLast7Days: z.number(),
    listingsCreatedPrev7Days: z.number(),
    activeListingsListedLast7Days: z.number(),
    usersCreatedLast7Days: z.number(),
    usersCreatedPrev7Days: z.number(),
    recentListings: z.array(recentListingSchema),
    recentPayments: z.array(recentPaymentSchema),
    recentUsers: z.array(recentUserSchema),
  }),
});
