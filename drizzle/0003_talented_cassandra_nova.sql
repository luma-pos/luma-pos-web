CREATE TYPE "public"."cash_fund" AS ENUM('cash', 'bank');--> statement-breakpoint
CREATE TYPE "public"."cash_tx_type" AS ENUM('in', 'out');--> statement-breakpoint
CREATE TYPE "public"."einvoice_status" AS ENUM('draft', 'issued', 'error');--> statement-breakpoint
CREATE TYPE "public"."trip_status" AS ENUM('planned', 'ongoing', 'done');--> statement-breakpoint
ALTER TYPE "public"."order_status" ADD VALUE 'merged';--> statement-breakpoint
CREATE TABLE "cash_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(30) NOT NULL,
	"type" "cash_tx_type" NOT NULL,
	"fund" "cash_fund" DEFAULT 'cash' NOT NULL,
	"amount" numeric(14, 2) NOT NULL,
	"category" text NOT NULL,
	"ref_type" text,
	"ref_id" uuid,
	"note" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cash_transactions_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "einvoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"status" "einvoice_status" DEFAULT 'draft' NOT NULL,
	"serial" varchar(20) DEFAULT '1C26TTP' NOT NULL,
	"number" varchar(20),
	"buyer_name" text NOT NULL,
	"buyer_tax_code" varchar(30),
	"vat_rate" numeric(5, 2) DEFAULT '10' NOT NULL,
	"total_before_vat" numeric(14, 2) DEFAULT '0' NOT NULL,
	"vat_amount" numeric(14, 2) DEFAULT '0' NOT NULL,
	"issued_at" timestamp with time zone,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "einvoices_order_id_unique" UNIQUE("order_id")
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"customer_id" uuid,
	"address" text,
	"status" text DEFAULT 'active' NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "promotions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"product_id" uuid NOT NULL,
	"tiers" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"starts_at" timestamp with time zone,
	"ends_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trip_stops" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trip_id" uuid NOT NULL,
	"order_id" uuid NOT NULL,
	"sort_order" integer DEFAULT 0,
	"status" text DEFAULT 'pending' NOT NULL,
	"delivered_at" timestamp with time zone,
	"note" text
);
--> statement-breakpoint
CREATE TABLE "trips" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(30) NOT NULL,
	"vehicle" text,
	"driver" text,
	"status" "trip_status" DEFAULT 'planned' NOT NULL,
	"depart_at" timestamp with time zone,
	"note" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "trips_code_unique" UNIQUE("code")
);
--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "portal_token" varchar(40);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "project_id" uuid;--> statement-breakpoint
ALTER TABLE "cash_transactions" ADD CONSTRAINT "cash_transactions_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "einvoices" ADD CONSTRAINT "einvoices_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promotions" ADD CONSTRAINT "promotions_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trip_stops" ADD CONSTRAINT "trip_stops_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trip_stops" ADD CONSTRAINT "trip_stops_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trips" ADD CONSTRAINT "trips_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "cash_tx_created_idx" ON "cash_transactions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "projects_customer_idx" ON "projects" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "promotions_product_idx" ON "promotions" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "trip_stops_trip_idx" ON "trip_stops" USING btree ("trip_id");--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_portal_token_unique" UNIQUE("portal_token");