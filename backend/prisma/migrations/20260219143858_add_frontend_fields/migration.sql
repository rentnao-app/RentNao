/*
  Warnings:

  - You are about to drop the column `availability_date` on the `Listing` table. All the data in the column will be lost.
  - The `listing_status` column on the `Listing` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `payment_type` on the `Payment` table. All the data in the column will be lost.
  - Added the required column `listing_start_date` to the `Listing` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `Listing` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `Property` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- CreateEnum
CREATE TYPE "FamilyStatus" AS ENUM ('FAMILY', 'BACHELOR');

-- CreateEnum
CREATE TYPE "TenantType" AS ENUM ('FAMILY', 'BACHELOR', 'BOTH');

-- CreateEnum
CREATE TYPE "PropertyCategory" AS ENUM ('RESIDENTIAL', 'COMMERCIAL');

-- CreateEnum
CREATE TYPE "BuildingFacing" AS ENUM ('EAST', 'WEST', 'NORTH', 'SOUTH');

-- CreateEnum
CREATE TYPE "ListingStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PENDING', 'RENTED', 'UNLISTED', 'EXPIRED', 'PRIORITISED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('BKASH', 'NAGAD', 'ROCKET', 'CARD', 'BANK_TRANSFER', 'CASH');

-- AlterTable
ALTER TABLE "Listing" DROP COLUMN "availability_date",
ADD COLUMN     "featured_until" TIMESTAMPTZ(6),
ADD COLUMN     "listing_end_date" TIMESTAMPTZ(6),
ADD COLUMN     "listing_start_date" TIMESTAMPTZ(6) NOT NULL,
ADD COLUMN     "updated_at" TIMESTAMPTZ(6) NOT NULL,
ADD COLUMN     "view_count" INTEGER NOT NULL DEFAULT 0,
DROP COLUMN "listing_status",
ADD COLUMN     "listing_status" "ListingStatus" NOT NULL DEFAULT 'DRAFT';

-- AlterTable
ALTER TABLE "OwnerProfile" ADD COLUMN     "intended_tenant_type" "TenantType",
ADD COLUMN     "owner_category" "PropertyCategory";

-- AlterTable
ALTER TABLE "Payment" DROP COLUMN "payment_type",
ADD COLUMN     "payment_method" "PaymentMethod",
ADD COLUMN     "transaction_id" TEXT;

-- AlterTable
ALTER TABLE "Property" ADD COLUMN     "address" TEXT,
ADD COLUMN     "balcony_count" INTEGER DEFAULT 0,
ADD COLUMN     "building_facing" "BuildingFacing",
ADD COLUMN     "building_floors" INTEGER,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "has_generator" BOOLEAN DEFAULT false,
ADD COLUMN     "has_lift" BOOLEAN DEFAULT false,
ADD COLUMN     "has_security_guard" BOOLEAN DEFAULT false,
ADD COLUMN     "title" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "TenantProfile" ADD COLUMN     "family_size" INTEGER,
ADD COLUMN     "family_status" "FamilyStatus";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "blood_group" TEXT,
ADD COLUMN     "current_area" TEXT,
ADD COLUMN     "current_lat" DOUBLE PRECISION,
ADD COLUMN     "current_lng" DOUBLE PRECISION,
ADD COLUMN     "date_of_birth" DATE,
ADD COLUMN     "full_name" TEXT,
ADD COLUMN     "gender" "Gender",
ADD COLUMN     "job_category" TEXT,
ADD COLUMN     "profession" TEXT,
ADD COLUMN     "profile_picture_path" TEXT,
ADD COLUMN     "religion" TEXT;

-- CreateTable
CREATE TABLE "PropertyImage" (
    "image_id" SERIAL NOT NULL,
    "property_id" INTEGER NOT NULL,
    "storage_path" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_size" INTEGER,
    "mime_type" TEXT,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "alt_text" TEXT,
    "uploaded_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PropertyImage_pkey" PRIMARY KEY ("image_id")
);

-- CreateIndex
CREATE INDEX "PropertyImage_property_id_idx" ON "PropertyImage"("property_id");

-- CreateIndex
CREATE INDEX "PropertyImage_property_id_display_order_idx" ON "PropertyImage"("property_id", "display_order");

-- CreateIndex
CREATE INDEX "Listing_listing_status_listing_start_date_idx" ON "Listing"("listing_status", "listing_start_date");

-- CreateIndex
CREATE INDEX "Listing_is_featured_created_at_idx" ON "Listing"("is_featured", "created_at");

-- AddForeignKey
ALTER TABLE "PropertyImage" ADD CONSTRAINT "PropertyImage_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "Property"("property_id") ON DELETE CASCADE ON UPDATE CASCADE;
