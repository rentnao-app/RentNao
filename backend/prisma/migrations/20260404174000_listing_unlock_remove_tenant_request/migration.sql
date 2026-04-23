-- Remove tenant requests for now
DROP TABLE IF EXISTS "TenantRequest";

-- Permanent per-tenant per-listing unlock entitlement
CREATE TABLE "ListingUnlock" (
  "id" TEXT NOT NULL,
  "listing_id" TEXT NOT NULL,
  "tenant_user_id" TEXT NOT NULL,
  "charge_id" TEXT,
  "unlocked_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ListingUnlock_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ListingUnlock_listing_id_tenant_user_id_key"
ON "ListingUnlock"("listing_id", "tenant_user_id");

CREATE INDEX "ListingUnlock_listing_id_idx"
ON "ListingUnlock"("listing_id");

CREATE INDEX "ListingUnlock_tenant_user_id_unlocked_at_idx"
ON "ListingUnlock"("tenant_user_id", "unlocked_at");

ALTER TABLE "ListingUnlock"
ADD CONSTRAINT "ListingUnlock_listing_id_fkey"
FOREIGN KEY ("listing_id") REFERENCES "Listing"("listing_id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ListingUnlock"
ADD CONSTRAINT "ListingUnlock_tenant_user_id_fkey"
FOREIGN KEY ("tenant_user_id") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
