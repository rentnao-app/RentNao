/*
  Warnings:

  - You are about to drop the column `property_size` on the `Property` table. All the data in the column will be lost.
  - The `property_type` column on the `Property` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `property_size_sqft` to the `Property` table without a default value. This is not possible if the table is not empty.
  - Made the column `room_count` on table `Property` required. This step will fail if there are existing NULL values in that column.
  - Made the column `bathroom_count` on table `Property` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `area_name` to the `Property` table without a default value. This is not possible if the table is not empty.
  - Made the column `exact_lat` on table `Property` required. This step will fail if there are existing NULL values in that column.
  - Made the column `exact_lng` on table `Property` required. This step will fail if there are existing NULL values in that column.
  - Made the column `address` on table `Property` required. This step will fail if there are existing NULL values in that column.
  - Made the column `balcony_count` on table `Property` required. This step will fail if there are existing NULL values in that column.
  - Made the column `building_facing` on table `Property` required. This step will fail if there are existing NULL values in that column.
  - Made the column `building_floors` on table `Property` required. This step will fail if there are existing NULL values in that column.
  - Made the column `description` on table `Property` required. This step will fail if there are existing NULL values in that column.
  - Made the column `has_generator` on table `Property` required. This step will fail if there are existing NULL values in that column.
  - Made the column `has_lift` on table `Property` required. This step will fail if there are existing NULL values in that column.
  - Made the column `has_security_guard` on table `Property` required. This step will fail if there are existing NULL values in that column.
  - Made the column `intended_tenant_type` on table `Property` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "PropertyType" AS ENUM ('APARTMENT');

-- CreateEnum
CREATE TYPE "AreaName" AS ENUM ('DHANMONDI', 'GULSHAN', 'BANANI', 'UTTARA', 'MIRPUR', 'MOHAMMADPUR', 'BASHUNDHARA', 'BADDA');

-- AlterTable
ALTER TABLE "Property" DROP COLUMN "property_size",
ADD COLUMN     "property_size_sqft" DECIMAL(65,30) NOT NULL,
DROP COLUMN "property_type",
ADD COLUMN     "property_type" "PropertyType" NOT NULL DEFAULT 'APARTMENT',
ALTER COLUMN "room_count" SET NOT NULL,
ALTER COLUMN "bathroom_count" SET NOT NULL,
DROP COLUMN "area_name",
ADD COLUMN     "area_name" "AreaName" NOT NULL,
ALTER COLUMN "exact_lat" SET NOT NULL,
ALTER COLUMN "exact_lng" SET NOT NULL,
ALTER COLUMN "address" SET NOT NULL,
ALTER COLUMN "balcony_count" SET NOT NULL,
ALTER COLUMN "building_facing" SET NOT NULL,
ALTER COLUMN "building_floors" SET NOT NULL,
ALTER COLUMN "description" SET NOT NULL,
ALTER COLUMN "has_generator" SET NOT NULL,
ALTER COLUMN "has_lift" SET NOT NULL,
ALTER COLUMN "has_security_guard" SET NOT NULL,
ALTER COLUMN "intended_tenant_type" SET NOT NULL;
