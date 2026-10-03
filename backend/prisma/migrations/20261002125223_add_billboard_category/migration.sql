-- CreateEnum
CREATE TYPE "BillboardType" AS ENUM ('DIGITAL', 'BANNER');

-- AlterEnum
ALTER TYPE "PropertyCategory" ADD VALUE 'BILLBOARD';

-- AlterTable
ALTER TABLE "Property" ADD COLUMN     "billboard_type" "BillboardType";
