-- DropForeignKey
ALTER TABLE "TopupRequest" DROP CONSTRAINT "TopupRequest_wallet_account_id_fkey";

-- AddForeignKey
ALTER TABLE "TopupRequest" ADD CONSTRAINT "TopupRequest_wallet_account_id_fkey" FOREIGN KEY ("wallet_account_id") REFERENCES "WalletAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
