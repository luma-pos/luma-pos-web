CREATE TABLE IF NOT EXISTS "ai_usage_counters" (
  "period" varchar(7) PRIMARY KEY NOT NULL,
  "used_units" integer DEFAULT 0 NOT NULL,
  "limit_units" integer DEFAULT 1000 NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
