export function mapUserRow(row: any) {
  return {
    userId: row.user_id,
    role: row.role,
    onboardingStatus: row.onboarding_status,
    contactEmail: row.contact_email,
    contactPhone: row.contact_phone,
    isActive: row.is_active,
    createdAt: row.created_at,
    deletedAt: row.deleted_at,
  };
}
