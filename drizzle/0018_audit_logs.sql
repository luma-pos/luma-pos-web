DO $$ BEGIN
 CREATE TYPE "public"."audit_log_source" AS ENUM('manual', 'ai', 'mobile', 'pos', 'system');
EXCEPTION
 WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."audit_log_status" AS ENUM('previewed', 'confirmed', 'succeeded', 'failed', 'cancelled', 'unauthorized');
EXCEPTION
 WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "audit_logs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "actor_id" uuid,
  "actor_name_snapshot" text,
  "source" "audit_log_source" DEFAULT 'manual' NOT NULL,
  "action" text NOT NULL,
  "entity_type" text NOT NULL,
  "entity_id" uuid,
  "status" "audit_log_status" DEFAULT 'succeeded' NOT NULL,
  "prompt" text,
  "parsed_intent" jsonb,
  "before" jsonb,
  "after" jsonb,
  "affected_records" jsonb,
  "metadata" jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "audit_logs_actor_id_profiles_id_fk"
    FOREIGN KEY ("actor_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_logs_actor_idx"
  ON "audit_logs" USING btree ("actor_id","created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_logs_entity_idx"
  ON "audit_logs" USING btree ("entity_type","entity_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_logs_created_idx"
  ON "audit_logs" USING btree ("created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_logs_source_status_idx"
  ON "audit_logs" USING btree ("source","status");
