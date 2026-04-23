/*
  Warnings:

  - The primary key for the `IdentityDocument` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Listing` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `OwnerProfile` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Payment` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Penalty` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Property` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `PropertyImage` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `TenantProfile` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `employment_info` on the `TenantProfile` table. All the data in the column will be lost.
  - You are about to drop the column `tenant_category` on the `TenantProfile` table. All the data in the column will be lost.
  - The `income_range` column on the `TenantProfile` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `TenantRequest` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `User` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `blood_group` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `contact_number` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `current_area` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `current_lat` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `current_lng` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `date_of_birth` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `email` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `full_name` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `gender` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `job_category` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `profession` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `profile_picture_path` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `religion` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `username` on the `User` table. All the data in the column will be lost.
  - The primary key for the `Wishlist` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `wishlist_id` on the `Wishlist` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[contact_email]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[contact_phone]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "OnboardingStatus" AS ENUM ('AUTH_PENDING', 'PROFILE_PENDING', 'COMPLETED');

-- CreateEnum
CREATE TYPE "IdentifierType" AS ENUM ('EMAIL', 'PHONE');

-- CreateEnum
CREATE TYPE "OAuthProvider" AS ENUM ('GOOGLE', 'FACEBOOK');

-- CreateEnum
CREATE TYPE "VerificationTokenType" AS ENUM ('EMAIL_VERIFICATION', 'PHONE_VERIFICATION', 'PASSWORD_RESET', 'MAGIC_LINK');

-- CreateEnum
CREATE TYPE "IncomeRange" AS ENUM ('BELOW_20K', 'RANGE_20K_40K', 'RANGE_40K_60K', 'RANGE_60K_100K', 'RANGE_100K_200K', 'ABOVE_200K');

-- CreateEnum
CREATE TYPE "EmploymentStatus" AS ENUM ('EMPLOYED', 'SELF_EMPLOYED', 'UNEMPLOYED', 'STUDENT', 'RETIRED');

-- CreateEnum
CREATE TYPE "JobCategory" AS ENUM ('TECHNOLOGY', 'HEALTHCARE', 'EDUCATION', 'FINANCE', 'CONSTRUCTION', 'HOSPITALITY', 'RETAIL', 'GOVERNMENT', 'SELF_EMPLOYED', 'OTHER');

-- CreateEnum
CREATE TYPE "LoginFailureReason" AS ENUM ('INVALID_CREDENTIALS', 'ACCOUNT_LOCKED', 'ACCOUNT_INACTIVE', 'EMAIL_NOT_VERIFIED', 'TOO_MANY_ATTEMPTS', 'INVALID_TOKEN');

-- DropForeignKey
ALTER TABLE "IdentityDocument" DROP CONSTRAINT "IdentityDocument_user_id_fkey";

-- DropForeignKey
ALTER TABLE "Listing" DROP CONSTRAINT "Listing_property_id_fkey";

-- DropForeignKey
ALTER TABLE "OwnerProfile" DROP CONSTRAINT "OwnerProfile_user_id_fkey";

-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_listing_id_fkey";

-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_user_id_fkey";

-- DropForeignKey
ALTER TABLE "Penalty" DROP CONSTRAINT "Penalty_user_id_fkey";

-- DropForeignKey
ALTER TABLE "Property" DROP CONSTRAINT "Property_owner_id_fkey";

-- DropForeignKey
ALTER TABLE "PropertyImage" DROP CONSTRAINT "PropertyImage_property_id_fkey";

-- DropForeignKey
ALTER TABLE "TenantProfile" DROP CONSTRAINT "TenantProfile_user_id_fkey";

-- DropForeignKey
ALTER TABLE "TenantRequest" DROP CONSTRAINT "TenantRequest_listing_id_fkey";

-- DropForeignKey
ALTER TABLE "TenantRequest" DROP CONSTRAINT "TenantRequest_tenant_id_fkey";

-- DropForeignKey
ALTER TABLE "Wishlist" DROP CONSTRAINT "Wishlist_listing_id_fkey";

-- DropForeignKey
ALTER TABLE "Wishlist" DROP CONSTRAINT "Wishlist_tenant_id_fkey";

-- DropIndex
DROP INDEX "User_email_key";

-- DropIndex
DROP INDEX "User_username_key";

-- DropIndex
DROP INDEX "Wishlist_tenant_id_listing_id_key";

-- AlterTable
ALTER TABLE "IdentityDocument" DROP CONSTRAINT "IdentityDocument_pkey",
ALTER COLUMN "document_id" DROP DEFAULT,
ALTER COLUMN "document_id" SET DATA TYPE TEXT,
ALTER COLUMN "user_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "IdentityDocument_pkey" PRIMARY KEY ("document_id");
DROP SEQUENCE "IdentityDocument_document_id_seq";

-- AlterTable
ALTER TABLE "Listing" DROP CONSTRAINT "Listing_pkey",
ALTER COLUMN "listing_id" DROP DEFAULT,
ALTER COLUMN "listing_id" SET DATA TYPE TEXT,
ALTER COLUMN "property_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "Listing_pkey" PRIMARY KEY ("listing_id");
DROP SEQUENCE "Listing_listing_id_seq";

-- AlterTable
ALTER TABLE "OwnerProfile" DROP CONSTRAINT "OwnerProfile_pkey",
ALTER COLUMN "owner_id" DROP DEFAULT,
ALTER COLUMN "owner_id" SET DATA TYPE TEXT,
ALTER COLUMN "user_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "OwnerProfile_pkey" PRIMARY KEY ("owner_id");
DROP SEQUENCE "OwnerProfile_owner_id_seq";

-- AlterTable
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_pkey",
ALTER COLUMN "payment_id" DROP DEFAULT,
ALTER COLUMN "payment_id" SET DATA TYPE TEXT,
ALTER COLUMN "user_id" SET DATA TYPE TEXT,
ALTER COLUMN "listing_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "Payment_pkey" PRIMARY KEY ("payment_id");
DROP SEQUENCE "Payment_payment_id_seq";

-- AlterTable
ALTER TABLE "Penalty" DROP CONSTRAINT "Penalty_pkey",
ALTER COLUMN "penalty_id" DROP DEFAULT,
ALTER COLUMN "penalty_id" SET DATA TYPE TEXT,
ALTER COLUMN "user_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "Penalty_pkey" PRIMARY KEY ("penalty_id");
DROP SEQUENCE "Penalty_penalty_id_seq";

-- AlterTable
ALTER TABLE "Property" DROP CONSTRAINT "Property_pkey",
ALTER COLUMN "property_id" DROP DEFAULT,
ALTER COLUMN "property_id" SET DATA TYPE TEXT,
ALTER COLUMN "owner_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "Property_pkey" PRIMARY KEY ("property_id");
DROP SEQUENCE "Property_property_id_seq";

-- AlterTable
ALTER TABLE "PropertyImage" DROP CONSTRAINT "PropertyImage_pkey",
ALTER COLUMN "image_id" DROP DEFAULT,
ALTER COLUMN "image_id" SET DATA TYPE TEXT,
ALTER COLUMN "property_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "PropertyImage_pkey" PRIMARY KEY ("image_id");
DROP SEQUENCE "PropertyImage_image_id_seq";

-- AlterTable
ALTER TABLE "TenantProfile" DROP CONSTRAINT "TenantProfile_pkey",
DROP COLUMN "employment_info",
DROP COLUMN "tenant_category",
ADD COLUMN     "employment_status" "EmploymentStatus",
ALTER COLUMN "tenant_id" DROP DEFAULT,
ALTER COLUMN "tenant_id" SET DATA TYPE TEXT,
ALTER COLUMN "user_id" SET DATA TYPE TEXT,
DROP COLUMN "income_range",
ADD COLUMN     "income_range" "IncomeRange",
ADD CONSTRAINT "TenantProfile_pkey" PRIMARY KEY ("tenant_id");
DROP SEQUENCE "TenantProfile_tenant_id_seq";

-- AlterTable
ALTER TABLE "TenantRequest" DROP CONSTRAINT "TenantRequest_pkey",
ALTER COLUMN "request_id" DROP DEFAULT,
ALTER COLUMN "request_id" SET DATA TYPE TEXT,
ALTER COLUMN "tenant_id" SET DATA TYPE TEXT,
ALTER COLUMN "listing_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "TenantRequest_pkey" PRIMARY KEY ("request_id");
DROP SEQUENCE "TenantRequest_request_id_seq";

-- AlterTable
ALTER TABLE "User" DROP CONSTRAINT "User_pkey",
DROP COLUMN "blood_group",
DROP COLUMN "contact_number",
DROP COLUMN "current_area",
DROP COLUMN "current_lat",
DROP COLUMN "current_lng",
DROP COLUMN "date_of_birth",
DROP COLUMN "email",
DROP COLUMN "full_name",
DROP COLUMN "gender",
DROP COLUMN "job_category",
DROP COLUMN "profession",
DROP COLUMN "profile_picture_path",
DROP COLUMN "religion",
DROP COLUMN "username",
ADD COLUMN     "contact_email" TEXT,
ADD COLUMN     "contact_phone" TEXT,
ADD COLUMN     "deleted_at" TIMESTAMPTZ(6),
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "last_login_at" TIMESTAMPTZ(6),
ADD COLUMN     "onboarding_status" "OnboardingStatus" NOT NULL DEFAULT 'AUTH_PENDING',
ALTER COLUMN "user_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "User_pkey" PRIMARY KEY ("user_id");

-- AlterTable
ALTER TABLE "Wishlist" DROP CONSTRAINT "Wishlist_pkey",
DROP COLUMN "wishlist_id",
ALTER COLUMN "tenant_id" SET DATA TYPE TEXT,
ALTER COLUMN "listing_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "Wishlist_pkey" PRIMARY KEY ("tenant_id", "listing_id");

-- CreateTable
CREATE TABLE "Credentials" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "identifier_type" "IdentifierType" NOT NULL,
    "password_hash" TEXT NOT NULL,
    "verified_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Credentials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OAuthAccount" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "provider" "OAuthProvider" NOT NULL,
    "provider_user_id" TEXT NOT NULL,
    "email" TEXT,
    "access_token" TEXT,
    "refresh_token" TEXT,
    "token_expires_at" TIMESTAMPTZ(6),
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "verified_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "OAuthAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "session_token" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "last_activity" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "type" "VerificationTokenType" NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VerificationToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BaseUserProfile" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "full_name" TEXT,
    "date_of_birth" DATE,
    "gender" "Gender",
    "religion" TEXT,
    "profession" TEXT,
    "job_category" "JobCategory",
    "profile_picture_path" TEXT,
    "current_lat" DOUBLE PRECISION,
    "current_lng" DOUBLE PRECISION,
    "current_area" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "BaseUserProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoginAttempt" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL,
    "failure_reason" "LoginFailureReason",
    "ip_address" TEXT,
    "user_agent" TEXT,
    "attempted_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoginAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Credentials_user_id_idx" ON "Credentials"("user_id");

-- CreateIndex
CREATE INDEX "Credentials_identifier_idx" ON "Credentials"("identifier");

-- CreateIndex
CREATE UNIQUE INDEX "Credentials_identifier_type_identifier_key" ON "Credentials"("identifier_type", "identifier");

-- CreateIndex
CREATE INDEX "OAuthAccount_user_id_idx" ON "OAuthAccount"("user_id");

-- CreateIndex
CREATE INDEX "OAuthAccount_email_idx" ON "OAuthAccount"("email");

-- CreateIndex
CREATE UNIQUE INDEX "OAuthAccount_provider_provider_user_id_key" ON "OAuthAccount"("provider", "provider_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "Session_session_token_key" ON "Session"("session_token");

-- CreateIndex
CREATE INDEX "Session_user_id_idx" ON "Session"("user_id");

-- CreateIndex
CREATE INDEX "Session_expires_at_idx" ON "Session"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE INDEX "VerificationToken_identifier_type_idx" ON "VerificationToken"("identifier", "type");

-- CreateIndex
CREATE INDEX "VerificationToken_expires_at_idx" ON "VerificationToken"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "BaseUserProfile_user_id_key" ON "BaseUserProfile"("user_id");

-- CreateIndex
CREATE INDEX "LoginAttempt_identifier_attempted_at_idx" ON "LoginAttempt"("identifier", "attempted_at");

-- CreateIndex
CREATE INDEX "LoginAttempt_user_id_attempted_at_idx" ON "LoginAttempt"("user_id", "attempted_at");

-- CreateIndex
CREATE INDEX "LoginAttempt_ip_address_attempted_at_idx" ON "LoginAttempt"("ip_address", "attempted_at");

-- CreateIndex
CREATE UNIQUE INDEX "User_contact_email_key" ON "User"("contact_email");

-- CreateIndex
CREATE UNIQUE INDEX "User_contact_phone_key" ON "User"("contact_phone");

-- AddForeignKey
ALTER TABLE "Credentials" ADD CONSTRAINT "Credentials_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OAuthAccount" ADD CONSTRAINT "OAuthAccount_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BaseUserProfile" ADD CONSTRAINT "BaseUserProfile_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoginAttempt" ADD CONSTRAINT "LoginAttempt_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OwnerProfile" ADD CONSTRAINT "OwnerProfile_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantProfile" ADD CONSTRAINT "TenantProfile_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Property" ADD CONSTRAINT "Property_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "OwnerProfile"("owner_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "Property"("property_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantRequest" ADD CONSTRAINT "TenantRequest_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "TenantProfile"("tenant_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantRequest" ADD CONSTRAINT "TenantRequest_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "Listing"("listing_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Wishlist" ADD CONSTRAINT "Wishlist_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "TenantProfile"("tenant_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Wishlist" ADD CONSTRAINT "Wishlist_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "Listing"("listing_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "Listing"("listing_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Penalty" ADD CONSTRAINT "Penalty_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IdentityDocument" ADD CONSTRAINT "IdentityDocument_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyImage" ADD CONSTRAINT "PropertyImage_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "Property"("property_id") ON DELETE RESTRICT ON UPDATE CASCADE;
