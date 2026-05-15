-- Remove deprecated legacy fee field now that flexible fields are in place
ALTER TABLE "FeePolicy"
  DROP COLUMN IF EXISTS "base_amount";