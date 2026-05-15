-- AlterTable: Add flexible fee composition fields to FeePolicy
ALTER TABLE "FeePolicy" 
  ADD COLUMN "fixed_amount" DECIMAL(12, 2),
  ADD COLUMN "percentage" DECIMAL(5, 2),
  ADD COLUMN "percent_base_field" VARCHAR(50),
  ADD COLUMN "min_amount" DECIMAL(12, 2),
  ADD COLUMN "max_amount" DECIMAL(12, 2);

-- Migrate existing base_amount as fixed_amount for backward compatibility
UPDATE "FeePolicy" SET fixed_amount = base_amount WHERE base_amount IS NOT NULL;

-- Make base_amount nullable (deprecated, but keep for now)
ALTER TABLE "FeePolicy" ALTER COLUMN base_amount DROP NOT NULL;
