-- AlterTable
ALTER TABLE "BaseUserProfile" ADD COLUMN     "father_name" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "father_name_bn" TEXT,
ADD COLUMN     "mother_name" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "mother_name_bn" TEXT;
