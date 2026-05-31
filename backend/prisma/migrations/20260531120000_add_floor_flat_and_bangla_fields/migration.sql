-- Property floor/flat fields (arefin) + Bengali transliteration columns
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "floor_no" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "flat_no" TEXT;
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "property_address_bn" TEXT;
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "floor_no_bn" TEXT;
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "flat_no_bn" TEXT;

-- BaseUserProfile Bengali transliteration columns
ALTER TABLE "BaseUserProfile" ADD COLUMN IF NOT EXISTS "full_name_bn" TEXT;
ALTER TABLE "BaseUserProfile" ADD COLUMN IF NOT EXISTS "profession_bn" TEXT;
ALTER TABLE "BaseUserProfile" ADD COLUMN IF NOT EXISTS "religion_bn" TEXT;
ALTER TABLE "BaseUserProfile" ADD COLUMN IF NOT EXISTS "phone_bn" TEXT;
ALTER TABLE "BaseUserProfile" ADD COLUMN IF NOT EXISTS "nid_bn" TEXT;
