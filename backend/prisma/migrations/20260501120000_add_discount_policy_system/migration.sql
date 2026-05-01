-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('FIXED', 'PERCENTAGE');

-- AlterTable
ALTER TABLE "Charge" ADD COLUMN     "discount_amount" DECIMAL(65,30),
ADD COLUMN     "discount_policy_id" TEXT;

-- CreateTable
CREATE TABLE "DiscountPolicy" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "fee_policy_code" TEXT NOT NULL,
    "discount_type" "DiscountType" NOT NULL,
    "fixed_amount" DECIMAL(65,30),
    "percentage" DECIMAL(65,30),
    "min_amount" DECIMAL(65,30),
    "max_amount" DECIMAL(65,30),
    "max_redemptions_total" INTEGER,
    "max_redemptions_per_user" INTEGER,
    "eligible_role" "UserRole",
    "effective_from" TIMESTAMPTZ(6) NOT NULL,
    "effective_to" TIMESTAMPTZ(6),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DiscountPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiscountEligibleUser" (
    "discount_policy_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DiscountEligibleUser_pkey" PRIMARY KEY ("discount_policy_id","user_id")
);

-- CreateTable
CREATE TABLE "DiscountRedemption" (
    "id" TEXT NOT NULL,
    "discount_policy_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "charge_id" TEXT,
    "discount_amount" DECIMAL(65,30) NOT NULL,
    "redeemed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DiscountRedemption_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DiscountPolicy_code_key" ON "DiscountPolicy"("code");

-- CreateIndex
CREATE INDEX "DiscountPolicy_fee_policy_code_idx" ON "DiscountPolicy"("fee_policy_code");

-- CreateIndex
CREATE INDEX "DiscountPolicy_is_active_effective_from_idx" ON "DiscountPolicy"("is_active", "effective_from");

-- CreateIndex
CREATE INDEX "DiscountEligibleUser_user_id_idx" ON "DiscountEligibleUser"("user_id");

-- CreateIndex
CREATE INDEX "DiscountRedemption_discount_policy_id_redeemed_at_idx" ON "DiscountRedemption"("discount_policy_id", "redeemed_at");

-- CreateIndex
CREATE INDEX "DiscountRedemption_user_id_redeemed_at_idx" ON "DiscountRedemption"("user_id", "redeemed_at");

-- CreateIndex
CREATE INDEX "DiscountRedemption_charge_id_idx" ON "DiscountRedemption"("charge_id");

-- AddForeignKey
ALTER TABLE "Charge" ADD CONSTRAINT "Charge_discount_policy_id_fkey" FOREIGN KEY ("discount_policy_id") REFERENCES "DiscountPolicy"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscountEligibleUser" ADD CONSTRAINT "DiscountEligibleUser_discount_policy_id_fkey" FOREIGN KEY ("discount_policy_id") REFERENCES "DiscountPolicy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscountEligibleUser" ADD CONSTRAINT "DiscountEligibleUser_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscountRedemption" ADD CONSTRAINT "DiscountRedemption_discount_policy_id_fkey" FOREIGN KEY ("discount_policy_id") REFERENCES "DiscountPolicy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscountRedemption" ADD CONSTRAINT "DiscountRedemption_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscountRedemption" ADD CONSTRAINT "DiscountRedemption_charge_id_fkey" FOREIGN KEY ("charge_id") REFERENCES "Charge"("id") ON DELETE SET NULL ON UPDATE CASCADE;
