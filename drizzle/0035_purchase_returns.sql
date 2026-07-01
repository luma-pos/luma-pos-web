CREATE TABLE "purchase_returns" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "code" varchar(30) NOT NULL,
  "purchase_order_id" uuid,
  "supplier_id" uuid NOT NULL,
  "warehouse_id" uuid NOT NULL,
  "status" text DEFAULT 'completed' NOT NULL,
  "settlement_status" text DEFAULT 'unsettled' NOT NULL,
  "subtotal" numeric(14, 2) DEFAULT '0' NOT NULL,
  "discount" numeric(14, 2) DEFAULT '0' NOT NULL,
  "vat_rate" numeric(5, 2) DEFAULT '0' NOT NULL,
  "tax" numeric(14, 2) DEFAULT '0' NOT NULL,
  "total_refund" numeric(14, 2) DEFAULT '0' NOT NULL,
  "refund_amount" numeric(14, 2) DEFAULT '0' NOT NULL,
  "refund_method" text,
  "debt_amount" numeric(14, 2) DEFAULT '0' NOT NULL,
  "note" text,
  "created_by" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "purchase_returns_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "purchase_return_items" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "purchase_return_id" uuid NOT NULL,
  "purchase_order_item_id" uuid,
  "product_id" uuid NOT NULL,
  "product_name" text NOT NULL,
  "sku" varchar(50) NOT NULL,
  "unit_name" varchar(30) NOT NULL,
  "quantity" numeric(14, 4) NOT NULL,
  "unit_cost" numeric(14, 2) NOT NULL,
  "return_unit_cost" numeric(14, 2) NOT NULL,
  "total" numeric(14, 2) NOT NULL
);
--> statement-breakpoint
ALTER TABLE "purchase_returns" ADD CONSTRAINT "purchase_returns_purchase_order_id_purchase_orders_id_fk" FOREIGN KEY ("purchase_order_id") REFERENCES "public"."purchase_orders"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "purchase_returns" ADD CONSTRAINT "purchase_returns_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "purchase_returns" ADD CONSTRAINT "purchase_returns_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "purchase_returns" ADD CONSTRAINT "purchase_returns_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "purchase_return_items" ADD CONSTRAINT "purchase_return_items_purchase_return_id_purchase_returns_id_fk" FOREIGN KEY ("purchase_return_id") REFERENCES "public"."purchase_returns"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "purchase_return_items" ADD CONSTRAINT "purchase_return_items_purchase_order_item_id_purchase_order_items_id_fk" FOREIGN KEY ("purchase_order_item_id") REFERENCES "public"."purchase_order_items"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "purchase_return_items" ADD CONSTRAINT "purchase_return_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "purchase_returns_purchase_idx" ON "purchase_returns" USING btree ("purchase_order_id");
--> statement-breakpoint
CREATE INDEX "purchase_returns_supplier_idx" ON "purchase_returns" USING btree ("supplier_id","created_at");
--> statement-breakpoint
CREATE INDEX "purchase_returns_created_idx" ON "purchase_returns" USING btree ("created_at");
--> statement-breakpoint
CREATE INDEX "purchase_return_items_return_idx" ON "purchase_return_items" USING btree ("purchase_return_id");
--> statement-breakpoint
CREATE INDEX "purchase_return_items_product_idx" ON "purchase_return_items" USING btree ("product_id");
