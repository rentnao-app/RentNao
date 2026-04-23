-- AlterTable
ALTER TABLE "BaseUserProfile" ALTER COLUMN "updated_at" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Credentials" ALTER COLUMN "updated_at" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Listing" ALTER COLUMN "updated_at" DROP NOT NULL;

-- AlterTable
ALTER TABLE "OAuthAccount" ALTER COLUMN "updated_at" DROP NOT NULL;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "updated_at" DROP NOT NULL;
