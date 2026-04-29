-- Make user-owned and ownership-tree references cascade so admin hard delete can purge a user cleanly.

ALTER TABLE IF EXISTS "Credentials"
  DROP CONSTRAINT IF EXISTS "Credentials_user_id_fkey";
ALTER TABLE IF EXISTS "Credentials"
  ADD CONSTRAINT "Credentials_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE IF EXISTS "OAuthAccount"
  DROP CONSTRAINT IF EXISTS "OAuthAccount_user_id_fkey";
ALTER TABLE IF EXISTS "OAuthAccount"
  ADD CONSTRAINT "OAuthAccount_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE IF EXISTS "Session"
  DROP CONSTRAINT IF EXISTS "Session_user_id_fkey";
ALTER TABLE IF EXISTS "Session"
  ADD CONSTRAINT "Session_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE IF EXISTS "LoginAttempt"
  DROP CONSTRAINT IF EXISTS "LoginAttempt_user_id_fkey";
ALTER TABLE IF EXISTS "LoginAttempt"
  ADD CONSTRAINT "LoginAttempt_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE IF EXISTS "BaseUserProfile"
  DROP CONSTRAINT IF EXISTS "BaseUserProfile_user_id_fkey";
ALTER TABLE IF EXISTS "BaseUserProfile"
  ADD CONSTRAINT "BaseUserProfile_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE IF EXISTS "OwnerProfile"
  DROP CONSTRAINT IF EXISTS "OwnerProfile_user_id_fkey";
ALTER TABLE IF EXISTS "OwnerProfile"
  ADD CONSTRAINT "OwnerProfile_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE IF EXISTS "TenantProfile"
  DROP CONSTRAINT IF EXISTS "TenantProfile_user_id_fkey";
ALTER TABLE IF EXISTS "TenantProfile"
  ADD CONSTRAINT "TenantProfile_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE IF EXISTS "WalletAccount"
  DROP CONSTRAINT IF EXISTS "WalletAccount_user_id_fkey";
ALTER TABLE IF EXISTS "WalletAccount"
  ADD CONSTRAINT "WalletAccount_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE IF EXISTS "WalletTransaction"
  DROP CONSTRAINT IF EXISTS "WalletTransaction_wallet_account_id_fkey";
ALTER TABLE IF EXISTS "WalletTransaction"
  ADD CONSTRAINT "WalletTransaction_wallet_account_id_fkey"
  FOREIGN KEY ("wallet_account_id") REFERENCES "WalletAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE IF EXISTS "Charge"
  DROP CONSTRAINT IF EXISTS "Charge_user_id_fkey";
ALTER TABLE IF EXISTS "Charge"
  ADD CONSTRAINT "Charge_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE IF EXISTS "TopupRequest"
  DROP CONSTRAINT IF EXISTS "TopupRequest_user_id_fkey";
ALTER TABLE IF EXISTS "TopupRequest"
  ADD CONSTRAINT "TopupRequest_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE IF EXISTS "TopupRequest"
  DROP CONSTRAINT IF EXISTS "TopupRequest_wallet_account_id_fkey";
ALTER TABLE IF EXISTS "TopupRequest"
  ADD CONSTRAINT "TopupRequest_wallet_account_id_fkey"
  FOREIGN KEY ("wallet_account_id") REFERENCES "WalletAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE IF EXISTS "WalletTopupRequest"
  DROP CONSTRAINT IF EXISTS "WalletTopupRequest_wallet_account_id_fkey";
ALTER TABLE IF EXISTS "WalletTopupRequest"
  ADD CONSTRAINT "WalletTopupRequest_wallet_account_id_fkey"
  FOREIGN KEY ("wallet_account_id") REFERENCES "WalletAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE IF EXISTS "Payment"
  DROP CONSTRAINT IF EXISTS "Payment_user_id_fkey";
ALTER TABLE IF EXISTS "Payment"
  ADD CONSTRAINT "Payment_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE IF EXISTS "Penalty"
  DROP CONSTRAINT IF EXISTS "Penalty_user_id_fkey";
ALTER TABLE IF EXISTS "Penalty"
  ADD CONSTRAINT "Penalty_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE IF EXISTS "Property"
  DROP CONSTRAINT IF EXISTS "Property_owner_id_fkey";
ALTER TABLE IF EXISTS "Property"
  ADD CONSTRAINT "Property_owner_id_fkey"
  FOREIGN KEY ("owner_id") REFERENCES "OwnerProfile"("owner_id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE IF EXISTS "Listing"
  DROP CONSTRAINT IF EXISTS "Listing_property_id_fkey";
ALTER TABLE IF EXISTS "Listing"
  ADD CONSTRAINT "Listing_property_id_fkey"
  FOREIGN KEY ("property_id") REFERENCES "Property"("property_id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE IF EXISTS "ListingUnlock"
  DROP CONSTRAINT IF EXISTS "ListingUnlock_listing_id_fkey";
ALTER TABLE IF EXISTS "ListingUnlock"
  ADD CONSTRAINT "ListingUnlock_listing_id_fkey"
  FOREIGN KEY ("listing_id") REFERENCES "Listing"("listing_id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE IF EXISTS "ListingUnlock"
  DROP CONSTRAINT IF EXISTS "ListingUnlock_tenant_user_id_fkey";
ALTER TABLE IF EXISTS "ListingUnlock"
  ADD CONSTRAINT "ListingUnlock_tenant_user_id_fkey"
  FOREIGN KEY ("tenant_user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE IF EXISTS "Wishlist"
  DROP CONSTRAINT IF EXISTS "Wishlist_tenant_id_fkey";
ALTER TABLE IF EXISTS "Wishlist"
  ADD CONSTRAINT "Wishlist_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "TenantProfile"("tenant_id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE IF EXISTS "Wishlist"
  DROP CONSTRAINT IF EXISTS "Wishlist_listing_id_fkey";
ALTER TABLE IF EXISTS "Wishlist"
  ADD CONSTRAINT "Wishlist_listing_id_fkey"
  FOREIGN KEY ("listing_id") REFERENCES "Listing"("listing_id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE IF EXISTS "RentalRequest"
  DROP CONSTRAINT IF EXISTS "RentalRequest_tenant_user_id_fkey";
ALTER TABLE IF EXISTS "RentalRequest"
  ADD CONSTRAINT "RentalRequest_tenant_user_id_fkey"
  FOREIGN KEY ("tenant_user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE IF EXISTS "TenantRequest"
  DROP CONSTRAINT IF EXISTS "TenantRequest_tenant_id_fkey";
ALTER TABLE IF EXISTS "TenantRequest"
  ADD CONSTRAINT "TenantRequest_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "TenantProfile"("tenant_id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE IF EXISTS "TenantRequest"
  DROP CONSTRAINT IF EXISTS "TenantRequest_listing_id_fkey";
ALTER TABLE IF EXISTS "TenantRequest"
  ADD CONSTRAINT "TenantRequest_listing_id_fkey"
  FOREIGN KEY ("listing_id") REFERENCES "Listing"("listing_id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE IF EXISTS "PropertyImage"
  DROP CONSTRAINT IF EXISTS "PropertyImage_property_id_fkey";
ALTER TABLE IF EXISTS "PropertyImage"
  ADD CONSTRAINT "PropertyImage_property_id_fkey"
  FOREIGN KEY ("property_id") REFERENCES "Property"("property_id") ON DELETE CASCADE ON UPDATE CASCADE;