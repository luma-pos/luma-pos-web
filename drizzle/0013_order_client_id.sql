ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "client_id" varchar(40);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "orders_client_id_key" ON "orders" USING btree ("client_id");
