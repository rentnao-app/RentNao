/*
  Warnings:

  - You are about to drop the column `full_name` on the `BaseUserProfile` table. All the data in the column will be lost.
  - You are about to drop the column `intended_tenant_type` on the `OwnerProfile` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "BaseUserProfile" DROP COLUMN "full_name",
ADD COLUMN     "first_name" TEXT,
ADD COLUMN     "last_name" TEXT;

-- AlterTable
ALTER TABLE "OwnerProfile" DROP COLUMN "intended_tenant_type";

-- AlterTable
ALTER TABLE "Property" ADD COLUMN     "intended_tenant_type" "TenantType";
