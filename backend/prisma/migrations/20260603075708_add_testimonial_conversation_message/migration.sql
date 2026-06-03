-- CreateTable
CREATE TABLE "Deal" (
    "deal_id" TEXT NOT NULL,
    "property_id" TEXT NOT NULL,
    "listing_id" TEXT,
    "owner_id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "document_url" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),

    CONSTRAINT "Deal_pkey" PRIMARY KEY ("deal_id")
);

-- CreateIndex
CREATE INDEX "Deal_owner_id_idx" ON "Deal"("owner_id");

-- CreateIndex
CREATE INDEX "Deal_tenant_id_idx" ON "Deal"("tenant_id");

-- CreateIndex
CREATE INDEX "Deal_property_id_idx" ON "Deal"("property_id");

-- AddForeignKey
ALTER TABLE "Deal" ADD CONSTRAINT "Deal_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "Property"("property_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deal" ADD CONSTRAINT "Deal_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "Listing"("listing_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deal" ADD CONSTRAINT "Deal_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deal" ADD CONSTRAINT "Deal_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
