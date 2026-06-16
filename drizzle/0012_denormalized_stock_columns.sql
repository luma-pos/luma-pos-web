ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "total_stock" numeric(14,4) DEFAULT '0' NOT NULL;
--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "min_stock" numeric(14,4) DEFAULT '0' NOT NULL;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "products_total_stock_idx" ON "products" USING btree ("total_stock");
