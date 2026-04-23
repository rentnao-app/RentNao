import { db } from '@/db/client';
import { storage } from '@/db/s3';

async function presignImageUrl(storagePath: string | null | undefined): Promise<string | null> {
  if (!storagePath) return null;
  try {
    return await storage.presignDownload(storagePath, 3600);
  } catch {
    return null;
  }
}

function toIso(value: unknown): string {
  if (!value) return '';
  if (value instanceof Date) return value.toISOString();
  const d = new Date(value as string);
  return Number.isNaN(d.getTime()) ? String(value) : d.toISOString();
}

function toNumber(value: unknown): number {
  if (value == null) return 0;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export async function getStatsOverview() {
  const roleStatsResult = await db.query(
    `SELECT role, COUNT(*) as count
     FROM "User"
     WHERE deleted_at IS NULL
     GROUP BY role`
  );

  const usersByRole = {
    TENANT: 0,
    OWNER: 0,
    ADMIN: 0,
  };

  roleStatsResult.rows.forEach((row: any) => {
    usersByRole[row.role as keyof typeof usersByRole] = parseInt(row.count, 10);
  });

  const onboardingStatsResult = await db.query(
    `SELECT onboarding_status, COUNT(*) as count
     FROM "User"
     WHERE deleted_at IS NULL
     GROUP BY onboarding_status`
  );

  const usersByOnboarding = {
    AUTH_PENDING: 0,
    PROFILE_PENDING: 0,
    COMPLETED: 0,
  };

  onboardingStatsResult.rows.forEach((row: any) => {
    usersByOnboarding[row.onboarding_status as keyof typeof usersByOnboarding] = parseInt(row.count, 10);
  });

  const recentResult = await db.query(
    `SELECT
      COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') as last_7_days,
      COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') as last_30_days
     FROM "User"
     WHERE deleted_at IS NULL`
  );

  const recentRegistrations = {
    last7Days: parseInt(recentResult.rows[0].last_7_days, 10) || 0,
    last30Days: parseInt(recentResult.rows[0].last_30_days, 10) || 0,
  };

  const activeTodayResult = await db.query(
    `SELECT COUNT(DISTINCT user_id) as count
     FROM "User"
     WHERE last_login_at >= CURRENT_DATE
     AND deleted_at IS NULL`
  );

  const activeToday = parseInt(activeTodayResult.rows[0].count, 10) || 0;

  const totalResult = await db.query(`SELECT COUNT(*) as count FROM "User" WHERE deleted_at IS NULL`);

  const totalUsers = parseInt(totalResult.rows[0].count, 10) || 0;

  const listingsCountResult = await db.query(`SELECT COUNT(*)::int as count FROM "Listing"`);
  const totalListings = parseInt(listingsCountResult.rows[0].count, 10) || 0;

  const earningsResult = await db.query(
    `SELECT COALESCE(SUM(final_amount), 0)::numeric as total
     FROM "Charge"
     WHERE status = 'SETTLED'`
  );
  const totalEarningsBdt = toNumber(earningsResult.rows[0]?.total);

  const pendingKycResult = await db.query(
    `SELECT COUNT(*)::int as count
     FROM "VerificationSubmission"
     WHERE submission_status IN ('SUBMITTED', 'UNDER_REVIEW')`
  );
  const pendingVerificationCount = parseInt(pendingKycResult.rows[0].count, 10) || 0;

  const listingTrendsResult = await db.query(
    `SELECT
      COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') as last_7,
      COUNT(*) FILTER (
        WHERE created_at >= NOW() - INTERVAL '14 days'
        AND created_at < NOW() - INTERVAL '7 days'
      ) as prev_7,
      COUNT(*) FILTER (WHERE listing_status = 'ACTIVE' AND created_at >= NOW() - INTERVAL '7 days') as active_listed_7
     FROM "Listing"`
  );

  const listingsCreatedLast7Days = parseInt(listingTrendsResult.rows[0].last_7, 10) || 0;
  const listingsCreatedPrev7Days = parseInt(listingTrendsResult.rows[0].prev_7, 10) || 0;
  const activeListingsListedLast7Days = parseInt(listingTrendsResult.rows[0].active_listed_7, 10) || 0;

  const userTrendsResult = await db.query(
    `SELECT
      COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') as last_7,
      COUNT(*) FILTER (
        WHERE created_at >= NOW() - INTERVAL '14 days'
        AND created_at < NOW() - INTERVAL '7 days'
      ) as prev_7
     FROM "User"
     WHERE deleted_at IS NULL`
  );

  const usersCreatedLast7Days = parseInt(userTrendsResult.rows[0].last_7, 10) || 0;
  const usersCreatedPrev7Days = parseInt(userTrendsResult.rows[0].prev_7, 10) || 0;

  const activeListingsCountResult = await db.query(
    `SELECT COUNT(*)::int as count FROM "Listing" WHERE listing_status = 'ACTIVE'`
  );
  const activeListingsCount = parseInt(activeListingsCountResult.rows[0].count, 10) || 0;

  const recentListingsResult = await db.query(
    `SELECT
      l.listing_id,
      l.rent,
      l.listing_status,
      l.created_at,
      p.title,
      p.area_name,
      (
        SELECT pi.storage_path
        FROM "PropertyImage" pi
        WHERE pi.property_id = p.property_id
        ORDER BY pi.is_primary DESC, pi.display_order ASC, pi.uploaded_at ASC
        LIMIT 1
      ) AS image_storage_path
     FROM "Listing" l
     JOIN "Property" p ON p.property_id = l.property_id
     ORDER BY l.created_at DESC
     LIMIT 6`
  );

  const recentListings = await Promise.all(
    recentListingsResult.rows.map(async (row: any) => ({
      listingId: row.listing_id,
      title: row.title,
      rent: toNumber(row.rent),
      listingStatus: row.listing_status,
      createdAt: toIso(row.created_at),
      areaName: row.area_name,
      imageUrl: await presignImageUrl(row.image_storage_path),
    }))
  );

  const recentPaymentsResult = await db.query(
    `SELECT
      wt.id,
      wt.amount,
      wt.currency,
      wt.created_at,
      wt.description,
      wt.type,
      COALESCE(u.contact_email, u.contact_phone, u.user_id) AS user_label
     FROM "WalletTransaction" wt
     JOIN "WalletAccount" wa ON wa.id = wt.wallet_account_id
     JOIN "User" u ON u.user_id = wa.user_id
     WHERE wt.status = 'POSTED'
     ORDER BY wt.created_at DESC
     LIMIT 3`
  );

  const recentPayments = recentPaymentsResult.rows.map((row: any) => ({
    id: row.id,
    amount: toNumber(row.amount),
    currency: row.currency || 'BDT',
    createdAt: toIso(row.created_at),
    description: row.description || null,
    type: row.type,
    userLabel: row.user_label,
  }));

  const recentUsersResult = await db.query(
    `SELECT
      u.user_id,
      u.role,
      u.contact_email,
      u.contact_phone,
      u.kyc_verification_status,
      u.onboarding_status,
      u.created_at,
      bp.first_name,
      bp.last_name
     FROM "User" u
     LEFT JOIN "BaseUserProfile" bp ON bp.user_id = u.user_id
     WHERE u.deleted_at IS NULL
     ORDER BY u.created_at DESC
     LIMIT 3`
  );

  const recentUsers = recentUsersResult.rows.map((row: any) => ({
    userId: row.user_id,
    role: row.role,
    contactEmail: row.contact_email,
    contactPhone: row.contact_phone,
    kycVerificationStatus: row.kyc_verification_status,
    onboardingStatus: row.onboarding_status,
    createdAt: toIso(row.created_at),
    firstName: row.first_name,
    lastName: row.last_name,
  }));

  return {
    usersByRole,
    usersByOnboarding,
    recentRegistrations,
    activeToday,
    totalUsers,
    totalListings,
    totalEarningsBdt,
    pendingVerificationCount,
    activeListingsCount,
    listingsCreatedLast7Days,
    listingsCreatedPrev7Days,
    activeListingsListedLast7Days,
    usersCreatedLast7Days,
    usersCreatedPrev7Days,
    recentListings,
    recentPayments,
    recentUsers,
  };
}
