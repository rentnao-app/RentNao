-- Enforce at most one ACTIVE listing per property
CREATE UNIQUE INDEX "Listing_single_active_per_property_idx"
ON "Listing" ("property_id")
WHERE "listing_status" = 'ACTIVE';
