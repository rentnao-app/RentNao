/*
  Warnings:

  - The values [PENDING,PRIORITISED] on the enum `ListingStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `featured_until` on the `Listing` table. All the data in the column will be lost.
  - You are about to drop the column `is_featured` on the `Listing` table. All the data in the column will be lost.
  - You are about to drop the `LoginAttempt` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Payment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Penalty` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Session` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "WalletStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "WalletTxnDirection" AS ENUM ('CREDIT', 'DEBIT');

-- CreateEnum
CREATE TYPE "WalletTxnType" AS ENUM ('TOPUP', 'LISTING_FEE', 'REFUND', 'ADJUSTMENT', 'REVERSAL');

-- CreateEnum
CREATE TYPE "WalletTxnStatus" AS ENUM ('PENDING', 'POSTED', 'FAILED', 'REVERSED');

-- CreateEnum
CREATE TYPE "TopupProvider" AS ENUM ('BKASH');

-- CreateEnum
CREATE TYPE "TopupStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "ChargeStatus" AS ENUM ('PENDING', 'SETTLED', 'FAILED', 'VOID');

-- AlterEnum
BEGIN;
CREATE TYPE "ListingStatus_new" AS ENUM ('DRAFT', 'ACTIVE', 'PENDING_PAYMENT', 'RENTED', 'UNLISTED', 'EXPIRED');
ALTER TABLE "Listing" ALTER COLUMN "listing_status" DROP DEFAULT;
ALTER TABLE "Listing" ALTER COLUMN "listing_status" TYPE "ListingStatus_new" USING ("listing_status"::text::"ListingStatus_new");
ALTER TYPE "ListingStatus" RENAME TO "ListingStatus_old";
ALTER TYPE "ListingStatus_new" RENAME TO "ListingStatus";
DROP TYPE "ListingStatus_old";
ALTER TABLE "Listing" ALTER COLUMN "listing_status" SET DEFAULT 'DRAFT';
COMMIT;

-- DropForeignKey
ALTER TABLE "LoginAttempt" DROP CONSTRAINT "LoginAttempt_user_id_fkey";

-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_listing_id_fkey";

-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_user_id_fkey";

-- DropForeignKey
ALTER TABLE "Penalty" DROP CONSTRAINT "Penalty_user_id_fkey";

-- DropForeignKey
ALTER TABLE "Session" DROP CONSTRAINT "Session_user_id_fkey";

-- DropIndex
DROP INDEX "Listing_is_featured_created_at_idx";

-- AlterTable
ALTER TABLE "Listing" DROP COLUMN "featured_until",
DROP COLUMN "is_featured";

-- DropTable
DROP TABLE "LoginAttempt";

-- DropTable
DROP TABLE "Payment";

-- DropTable
DROP TABLE "Penalty";

-- DropTable
DROP TABLE "Session";

-- DropEnum
DROP TYPE "LoginFailureReason";

-- DropEnum
DROP TYPE "PaymentMethod";

-- CreateTable
CREATE TABLE "WalletAccount" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "status" "WalletStatus" NOT NULL DEFAULT 'ACTIVE',
    "currency" TEXT NOT NULL DEFAULT 'BDT',
    "available_balance" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),

    CONSTRAINT "WalletAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WalletTransaction" (
    "id" TEXT NOT NULL,
    "wallet_account_id" TEXT NOT NULL,
    "direction" "WalletTxnDirection" NOT NULL,
    "type" "WalletTxnType" NOT NULL,
    "status" "WalletTxnStatus" NOT NULL DEFAULT 'PENDING',
    "amount" DECIMAL(65,30) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'BDT',
    "reference_type" TEXT,
    "reference_id" TEXT,
    "description" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "posted_at" TIMESTAMPTZ(6),

    CONSTRAINT "WalletTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeePolicy" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'BDT',
    "base_amount" DECIMAL(65,30) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "effective_from" TIMESTAMPTZ(6) NOT NULL,
    "effective_to" TIMESTAMPTZ(6),
    "created_by" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeePolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Charge" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "fee_policy_id" TEXT NOT NULL,
    "reference_type" TEXT NOT NULL,
    "reference_id" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'BDT',
    "base_amount" DECIMAL(65,30) NOT NULL,
    "final_amount" DECIMAL(65,30) NOT NULL,
    "status" "ChargeStatus" NOT NULL DEFAULT 'PENDING',
    "failure_reason" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "settled_at" TIMESTAMPTZ(6),
    "updated_at" TIMESTAMPTZ(6),

    CONSTRAINT "Charge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WalletTopupRequest" (
    "id" TEXT NOT NULL,
    "wallet_account_id" TEXT NOT NULL,
    "provider" "TopupProvider" NOT NULL DEFAULT 'BKASH',
    "status" "TopupStatus" NOT NULL DEFAULT 'PENDING',
    "requested_amount" DECIMAL(65,30) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'BDT',
    "external_request_id" TEXT NOT NULL,
    "external_payment_id" TEXT,
    "external_trx_id" TEXT,
    "provider_payload" JSONB,
    "failure_reason" TEXT,
    "expires_at" TIMESTAMPTZ(6),
    "completed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),

    CONSTRAINT "WalletTopupRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WalletAccount_user_id_key" ON "WalletAccount"("user_id");

-- CreateIndex
CREATE INDEX "WalletAccount_status_idx" ON "WalletAccount"("status");

-- CreateIndex
CREATE INDEX "WalletTransaction_wallet_account_id_created_at_idx" ON "WalletTransaction"("wallet_account_id", "created_at");

-- CreateIndex
CREATE INDEX "WalletTransaction_reference_type_reference_id_idx" ON "WalletTransaction"("reference_type", "reference_id");

-- CreateIndex
CREATE INDEX "WalletTransaction_status_created_at_idx" ON "WalletTransaction"("status", "created_at");

-- CreateIndex
CREATE INDEX "FeePolicy_code_idx" ON "FeePolicy"("code");

-- CreateIndex
CREATE INDEX "FeePolicy_is_active_effective_from_idx" ON "FeePolicy"("is_active", "effective_from");

-- CreateIndex
CREATE UNIQUE INDEX "FeePolicy_code_version_key" ON "FeePolicy"("code", "version");

-- CreateIndex
CREATE INDEX "Charge_user_id_created_at_idx" ON "Charge"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "Charge_reference_type_reference_id_idx" ON "Charge"("reference_type", "reference_id");

-- CreateIndex
CREATE INDEX "Charge_status_created_at_idx" ON "Charge"("status", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "WalletTopupRequest_external_request_id_key" ON "WalletTopupRequest"("external_request_id");

-- CreateIndex
CREATE INDEX "WalletTopupRequest_wallet_account_id_created_at_idx" ON "WalletTopupRequest"("wallet_account_id", "created_at");

-- CreateIndex
CREATE INDEX "WalletTopupRequest_status_created_at_idx" ON "WalletTopupRequest"("status", "created_at");

-- AddForeignKey
ALTER TABLE "WalletAccount" ADD CONSTRAINT "WalletAccount_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletTransaction" ADD CONSTRAINT "WalletTransaction_wallet_account_id_fkey" FOREIGN KEY ("wallet_account_id") REFERENCES "WalletAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Charge" ADD CONSTRAINT "Charge_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Charge" ADD CONSTRAINT "Charge_fee_policy_id_fkey" FOREIGN KEY ("fee_policy_id") REFERENCES "FeePolicy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletTopupRequest" ADD CONSTRAINT "WalletTopupRequest_wallet_account_id_fkey" FOREIGN KEY ("wallet_account_id") REFERENCES "WalletAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
