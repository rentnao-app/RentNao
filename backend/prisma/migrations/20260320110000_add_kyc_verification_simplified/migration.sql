/*
  Warnings:

  - You are about to drop the `IdentityDocument` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "KycVerificationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "VerificationSubmissionStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "DocumentVerificationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "IdentityDocumentType" AS ENUM ('NATIONAL_ID', 'BIRTH_REGISTRATION', 'PROOF_OF_OWNERSHIP');

-- DropForeignKey
ALTER TABLE "IdentityDocument" DROP CONSTRAINT "IdentityDocument_user_id_fkey";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "kyc_verification_status" "KycVerificationStatus" NOT NULL DEFAULT 'PENDING';

-- DropTable
DROP TABLE "IdentityDocument";

-- CreateTable
CREATE TABLE "VerificationSubmission" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "submission_status" "VerificationSubmissionStatus" NOT NULL DEFAULT 'DRAFT',
    "submitted_at" TIMESTAMPTZ(6),
    "reviewed_at" TIMESTAMPTZ(6),
    "reviewed_by" TEXT,
    "rejection_reason" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),

    CONSTRAINT "VerificationSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserIdentityDocument" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "submission_id" TEXT,
    "document_type" "IdentityDocumentType" NOT NULL,
    "document_number" TEXT,
    "file_path" TEXT,
    "file_name" TEXT,
    "mime_type" TEXT,
    "file_size_bytes" INTEGER,
    "verification_status" "DocumentVerificationStatus" NOT NULL DEFAULT 'PENDING',
    "rejection_reason" TEXT,
    "uploaded_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewed_at" TIMESTAMPTZ(6),
    "reviewed_by" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),

    CONSTRAINT "UserIdentityDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VerificationSubmission_user_id_key" ON "VerificationSubmission"("user_id");

-- CreateIndex
CREATE INDEX "VerificationSubmission_user_id_idx" ON "VerificationSubmission"("user_id");

-- CreateIndex
CREATE INDEX "VerificationSubmission_submission_status_idx" ON "VerificationSubmission"("submission_status");

-- CreateIndex
CREATE INDEX "VerificationSubmission_submitted_at_idx" ON "VerificationSubmission"("submitted_at");

-- CreateIndex
CREATE INDEX "UserIdentityDocument_user_id_idx" ON "UserIdentityDocument"("user_id");

-- CreateIndex
CREATE INDEX "UserIdentityDocument_submission_id_idx" ON "UserIdentityDocument"("submission_id");

-- CreateIndex
CREATE INDEX "UserIdentityDocument_document_type_idx" ON "UserIdentityDocument"("document_type");

-- CreateIndex
CREATE INDEX "UserIdentityDocument_verification_status_idx" ON "UserIdentityDocument"("verification_status");

-- AddForeignKey
ALTER TABLE "VerificationSubmission" ADD CONSTRAINT "VerificationSubmission_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserIdentityDocument" ADD CONSTRAINT "UserIdentityDocument_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserIdentityDocument" ADD CONSTRAINT "UserIdentityDocument_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "VerificationSubmission"("id") ON DELETE SET NULL ON UPDATE CASCADE;
