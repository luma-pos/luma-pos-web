ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "source_order_id" uuid;
--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "source_mode" varchar(20);
--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "source_sale_time" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "replaced_by_order_id" uuid;
--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_source_order_id_orders_id_fk" FOREIGN KEY ("source_order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_replaced_by_order_id_orders_id_fk" FOREIGN KEY ("replaced_by_order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "orders_source_idx" ON "orders" USING btree ("source_order_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "orders_replaced_by_idx" ON "orders" USING btree ("replaced_by_order_id");
