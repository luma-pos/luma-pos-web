CREATE TABLE IF NOT EXISTS "mobile_notification_states" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "profiles"("id") ON DELETE cascade,
  "notification_id" text NOT NULL,
  "read" boolean DEFAULT false NOT NULL,
  "dismissed" boolean DEFAULT false NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "mobile_notification_states_user_notification_idx"
  ON "mobile_notification_states" ("user_id", "notification_id");
