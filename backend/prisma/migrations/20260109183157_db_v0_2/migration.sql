/*
  Warnings:

  - The `verification_status` column on the `IdentityDocument` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "DocumentVerification" AS ENUM ('ACCEPTED', 'REJECTED', 'PENDING');

-- AlterTable
ALTER TABLE "IdentityDocument" DROP COLUMN "verification_status",
ADD COLUMN     "verification_status" "DocumentVerification" NOT NULL DEFAULT 'PENDING';
