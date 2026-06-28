ALTER TABLE "ai_usage_counters" ADD COLUMN IF NOT EXISTS "input_tokens" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "ai_usage_counters" ADD COLUMN IF NOT EXISTS "output_tokens" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "ai_usage_counters" ADD COLUMN IF NOT EXISTS "total_tokens" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "ai_usage_counters" ADD COLUMN IF NOT EXISTS "estimated_cost_microusd" integer DEFAULT 0 NOT NULL;
