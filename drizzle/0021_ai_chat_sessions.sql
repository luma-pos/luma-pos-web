CREATE TABLE IF NOT EXISTS "ai_chat_sessions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "owner_id" uuid REFERENCES "public"."profiles"("id"),
  "surface" text DEFAULT 'web' NOT NULL,
  "title" text DEFAULT 'AI Assistant' NOT NULL,
  "metadata" jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ai_chat_messages" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "session_id" uuid NOT NULL REFERENCES "public"."ai_chat_sessions"("id") ON DELETE cascade,
  "role" text NOT NULL,
  "content" text NOT NULL,
  "state" text,
  "attachments" jsonb,
  "preview" jsonb,
  "result" text,
  "record" jsonb,
  "metadata" jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ai_chat_sessions_owner_idx" ON "ai_chat_sessions" USING btree ("owner_id","updated_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ai_chat_sessions_surface_idx" ON "ai_chat_sessions" USING btree ("surface","updated_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ai_chat_messages_session_idx" ON "ai_chat_messages" USING btree ("session_id","created_at");
