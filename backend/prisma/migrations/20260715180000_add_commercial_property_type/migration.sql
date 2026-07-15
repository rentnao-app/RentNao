-- Expand PropertyType so residential vs commercial can be stored and edited by admins.
DO $$ BEGIN
  ALTER TYPE "PropertyType" ADD VALUE 'COMMERCIAL_SPACE';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
