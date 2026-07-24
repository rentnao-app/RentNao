-- Building amenities + nearby landmarks for property listings
ALTER TABLE "Property"
  ADD COLUMN IF NOT EXISTS "has_garage" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "has_cc_camera" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "nearby_metro_station" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "nearby_public_transports" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "nearby_mosque" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "nearby_school" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "nearby_gym" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "nearby_turf" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "nearby_playing_field" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "nearby_bazar" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "nearby_supershop" BOOLEAN NOT NULL DEFAULT false;
