-- Gas amenity for property listings
ALTER TABLE "Property"
  ADD COLUMN IF NOT EXISTS "has_gas" BOOLEAN NOT NULL DEFAULT false;
