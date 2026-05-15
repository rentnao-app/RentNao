-- Phone-first onboarding states
-- Replace AUTH_PENDING with PHONE_REQUIRED and PHONE_VERIFICATION_PENDING

BEGIN;

CREATE TYPE "OnboardingStatus_new" AS ENUM (
  'PHONE_REQUIRED',
  'PHONE_VERIFICATION_PENDING',
  'PROFILE_PENDING',
  'COMPLETED'
);

ALTER TABLE "User"
ALTER COLUMN "onboarding_status" DROP DEFAULT;

ALTER TABLE "User"
ALTER COLUMN "onboarding_status"
TYPE "OnboardingStatus_new"
USING (
  CASE
    WHEN "onboarding_status"::text = 'AUTH_PENDING' THEN
      CASE
        WHEN "contact_phone" IS NULL THEN 'PHONE_REQUIRED'
        ELSE 'PHONE_VERIFICATION_PENDING'
      END
    WHEN "onboarding_status"::text = 'PROFILE_PENDING' AND "contact_phone" IS NULL THEN 'PHONE_REQUIRED'
    ELSE "onboarding_status"::text
  END
)::"OnboardingStatus_new";

ALTER TYPE "OnboardingStatus" RENAME TO "OnboardingStatus_old";
ALTER TYPE "OnboardingStatus_new" RENAME TO "OnboardingStatus";
DROP TYPE "OnboardingStatus_old";

ALTER TABLE "User"
ALTER COLUMN "onboarding_status" SET DEFAULT 'PHONE_VERIFICATION_PENDING';

COMMIT;
