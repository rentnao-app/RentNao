-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('TENANT', 'OWNER', 'ADMIN');

-- CreateTable
CREATE TABLE "User" (
    "user_id" UUID NOT NULL,
    "username" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'TENANT',
    "contact_number" TEXT,
    "email" TEXT NOT NULL,
    "verification_status" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "OwnerProfile" (
    "owner_id" SERIAL NOT NULL,
    "user_id" UUID NOT NULL,
    "owner_score" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OwnerProfile_pkey" PRIMARY KEY ("owner_id")
);

-- CreateTable
CREATE TABLE "TenantProfile" (
    "tenant_id" SERIAL NOT NULL,
    "user_id" UUID NOT NULL,
    "income_range" TEXT,
    "employment_info" TEXT,
    "tenant_category" TEXT,
    "tenant_score" DECIMAL(65,30) DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TenantProfile_pkey" PRIMARY KEY ("tenant_id")
);

-- CreateTable
CREATE TABLE "Property" (
    "property_id" SERIAL NOT NULL,
    "owner_id" INTEGER NOT NULL,
    "property_type" TEXT NOT NULL,
    "property_size" DECIMAL(65,30),
    "room_count" DECIMAL(65,30),
    "bathroom_count" DECIMAL(65,30),
    "area_name" TEXT,
    "exact_lat" DOUBLE PRECISION,
    "exact_lng" DOUBLE PRECISION,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Property_pkey" PRIMARY KEY ("property_id")
);

-- CreateTable
CREATE TABLE "Listing" (
    "listing_id" SERIAL NOT NULL,
    "property_id" INTEGER NOT NULL,
    "rent" DECIMAL(65,30) NOT NULL,
    "availability_date" TIMESTAMPTZ(6),
    "listing_status" TEXT NOT NULL DEFAULT 'active',
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Listing_pkey" PRIMARY KEY ("listing_id")
);

-- CreateTable
CREATE TABLE "TenantRequest" (
    "request_id" SERIAL NOT NULL,
    "tenant_id" INTEGER NOT NULL,
    "listing_id" INTEGER NOT NULL,
    "request_status" TEXT NOT NULL DEFAULT 'pending',
    "requested_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TenantRequest_pkey" PRIMARY KEY ("request_id")
);

-- CreateTable
CREATE TABLE "Wishlist" (
    "wishlist_id" SERIAL NOT NULL,
    "tenant_id" INTEGER NOT NULL,
    "listing_id" INTEGER NOT NULL,
    "added_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Wishlist_pkey" PRIMARY KEY ("wishlist_id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "payment_id" SERIAL NOT NULL,
    "user_id" UUID NOT NULL,
    "listing_id" INTEGER NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "payment_type" TEXT,
    "payment_status" TEXT NOT NULL DEFAULT 'pending',
    "paid_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("payment_id")
);

-- CreateTable
CREATE TABLE "Penalty" (
    "penalty_id" SERIAL NOT NULL,
    "user_id" UUID NOT NULL,
    "reason" TEXT,
    "points_deducted" DECIMAL(65,30) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Penalty_pkey" PRIMARY KEY ("penalty_id")
);

-- CreateTable
CREATE TABLE "IdentityDocument" (
    "document_id" SERIAL NOT NULL,
    "user_id" UUID NOT NULL,
    "document_type" TEXT NOT NULL,
    "document_number" TEXT,
    "file_path" TEXT,
    "verification_status" TEXT NOT NULL DEFAULT 'pending',
    "uploaded_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IdentityDocument_pkey" PRIMARY KEY ("document_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "OwnerProfile_user_id_key" ON "OwnerProfile"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "TenantProfile_user_id_key" ON "TenantProfile"("user_id");

-- CreateIndex
CREATE INDEX "Property_owner_id_idx" ON "Property"("owner_id");

-- CreateIndex
CREATE INDEX "Listing_property_id_idx" ON "Listing"("property_id");

-- CreateIndex
CREATE INDEX "TenantRequest_tenant_id_idx" ON "TenantRequest"("tenant_id");

-- CreateIndex
CREATE INDEX "TenantRequest_listing_id_idx" ON "TenantRequest"("listing_id");

-- CreateIndex
CREATE UNIQUE INDEX "Wishlist_tenant_id_listing_id_key" ON "Wishlist"("tenant_id", "listing_id");

-- CreateIndex
CREATE INDEX "Payment_user_id_idx" ON "Payment"("user_id");

-- CreateIndex
CREATE INDEX "Payment_listing_id_idx" ON "Payment"("listing_id");

-- AddForeignKey
ALTER TABLE "OwnerProfile" ADD CONSTRAINT "OwnerProfile_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantProfile" ADD CONSTRAINT "TenantProfile_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Property" ADD CONSTRAINT "Property_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "OwnerProfile"("owner_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "Property"("property_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantRequest" ADD CONSTRAINT "TenantRequest_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "TenantProfile"("tenant_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantRequest" ADD CONSTRAINT "TenantRequest_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "Listing"("listing_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Wishlist" ADD CONSTRAINT "Wishlist_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "TenantProfile"("tenant_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Wishlist" ADD CONSTRAINT "Wishlist_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "Listing"("listing_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "Listing"("listing_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Penalty" ADD CONSTRAINT "Penalty_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IdentityDocument" ADD CONSTRAINT "IdentityDocument_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
