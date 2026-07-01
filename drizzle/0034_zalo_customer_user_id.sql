ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "zalo_user_id" text;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "customers_zalo_user_id_idx" ON "customers" USING btree ("zalo_user_id");
