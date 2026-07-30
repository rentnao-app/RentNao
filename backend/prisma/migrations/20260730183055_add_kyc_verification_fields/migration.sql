-- AlterTable
ALTER TABLE "VerificationSubmission" ADD COLUMN     "auto_verified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "kyc_match_score" DOUBLE PRECISION,
ADD COLUMN     "kyc_provider" TEXT,
ADD COLUMN     "kyc_reference_id" TEXT,
ADD COLUMN     "kyc_risk_level" TEXT;
