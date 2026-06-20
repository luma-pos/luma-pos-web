DO $$ BEGIN
  CREATE TYPE "public"."customer_consent_status" AS ENUM('pending', 'granted', 'withdrawn');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "customer_consents" (
  "customer_id" uuid PRIMARY KEY NOT NULL,
  "status" "customer_consent_status" DEFAULT 'pending' NOT NULL,
  "purposes" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "source" text DEFAULT 'mobile' NOT NULL,
  "note" text,
  "updated_by" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "customer_consents_customer_id_customers_id_fk"
    FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action,
  CONSTRAINT "customer_consents_updated_by_profiles_id_fk"
    FOREIGN KEY ("updated_by") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "customer_consent_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "customer_id" uuid NOT NULL,
  "status" "customer_consent_status" NOT NULL,
  "purposes" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "source" text DEFAULT 'mobile' NOT NULL,
  "note" text,
  "created_by" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "customer_consent_events_customer_id_customers_id_fk"
    FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action,
  CONSTRAINT "customer_consent_events_created_by_profiles_id_fk"
    FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "customer_consent_events_customer_idx"
  ON "customer_consent_events" USING btree ("customer_id","created_at");
