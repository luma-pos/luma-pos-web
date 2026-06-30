ALTER TABLE "print_templates" ADD COLUMN IF NOT EXISTS "id" uuid;--> statement-breakpoint
UPDATE "print_templates" SET "id" = gen_random_uuid() WHERE "id" IS NULL;--> statement-breakpoint
ALTER TABLE "print_templates" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "print_templates" ALTER COLUMN "id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "print_templates" ADD COLUMN IF NOT EXISTS "name" text;--> statement-breakpoint
UPDATE "print_templates"
SET "name" = CASE "doc_type"
  WHEN 'order' THEN 'Mẫu hóa đơn mặc định'
  WHEN 'quote' THEN 'Mẫu báo giá mặc định'
  WHEN 'booking' THEN 'Mẫu đặt hàng mặc định'
  WHEN 'purchase' THEN 'Mẫu nhập hàng mặc định'
  WHEN 'return' THEN 'Mẫu trả hàng mặc định'
  ELSE 'Mẫu biên nhận mặc định'
END
WHERE "name" IS NULL OR btrim("name") = '';--> statement-breakpoint
ALTER TABLE "print_templates" ALTER COLUMN "name" SET DEFAULT 'Mẫu in';--> statement-breakpoint
ALTER TABLE "print_templates" ALTER COLUMN "name" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "print_templates" ADD COLUMN IF NOT EXISTS "is_default" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "print_templates" ADD COLUMN IF NOT EXISTS "is_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "print_templates" ADD COLUMN IF NOT EXISTS "sort_order" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "print_templates" DROP CONSTRAINT IF EXISTS "print_templates_pkey";--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'print_templates_pkey'
      AND conrelid = 'print_templates'::regclass
  ) THEN
    ALTER TABLE "print_templates" ADD CONSTRAINT "print_templates_pkey" PRIMARY KEY ("id");
  END IF;
END $$;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "print_templates_doc_type_idx" ON "print_templates" ("doc_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "print_templates_active_idx" ON "print_templates" ("is_active");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "print_templates_default_doc_type_idx"
ON "print_templates" ("doc_type")
WHERE "is_default" = true AND "is_active" = true;
