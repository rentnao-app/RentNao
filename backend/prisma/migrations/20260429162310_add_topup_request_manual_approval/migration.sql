/*
  Warnings:

  - You are about to drop the `WalletTopupRequest` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "TopupRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- DropForeignKey
ALTER TABLE "WalletTopupRequest" DROP CONSTRAINT "WalletTopupRequest_wallet_account_id_fkey";

-- DropTable
DROP TABLE "WalletTopupRequest";

-- DropEnum
DROP TYPE "TopupProvider";

-- DropEnum
DROP TYPE "TopupStatus";

-- CreateTable
CREATE TABLE "TopupRequest" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "wallet_account_id" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "bkash_number" TEXT NOT NULL,
    "transaction_id" TEXT NOT NULL,
    "status" "TopupRequestStatus" NOT NULL DEFAULT 'PENDING',
    "rejection_reason" TEXT,
    "approved_at" TIMESTAMPTZ(6),
    "approved_by_admin_id" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),

    CONSTRAINT "TopupRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TopupRequest_transaction_id_key" ON "TopupRequest"("transaction_id");

-- CreateIndex
CREATE INDEX "TopupRequest_user_id_created_at_idx" ON "TopupRequest"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "TopupRequest_status_created_at_idx" ON "TopupRequest"("status", "created_at");

-- CreateIndex
CREATE INDEX "TopupRequest_wallet_account_id_status_idx" ON "TopupRequest"("wallet_account_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "TopupRequest_user_id_transaction_id_key" ON "TopupRequest"("user_id", "transaction_id");

-- AddForeignKey
ALTER TABLE "TopupRequest" ADD CONSTRAINT "TopupRequest_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TopupRequest" ADD CONSTRAINT "TopupRequest_wallet_account_id_fkey" FOREIGN KEY ("wallet_account_id") REFERENCES "WalletAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TopupRequest" ADD CONSTRAINT "TopupRequest_approved_by_admin_id_fkey" FOREIGN KEY ("approved_by_admin_id") REFERENCES "User"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;
