/*
  SAFE MANUAL MIGRATION
  - Renames enum
  - Migrates boolean → enum
  - Preserves all data
*/

-- Rename enum (DO NOT create a new one)
ALTER TYPE "DocumentVerification" RENAME TO "Verification";

-- Add temp enum column to User
ALTER TABLE "User"
ADD COLUMN "temp_verification" "Verification" NOT NULL DEFAULT 'PENDING'::"Verification";

-- Backfill data
UPDATE "User"
SET "temp_verification" =
  CASE
    WHEN "verification_status" = true THEN 'ACCEPTED'::"Verification"
    ELSE 'PENDING'::"Verification"
  END;

-- Drop old boolean column
ALTER TABLE "User"
DROP COLUMN "verification_status";

-- Rename temp column
ALTER TABLE "User"
RENAME COLUMN "temp_verification" TO "verification_status";
