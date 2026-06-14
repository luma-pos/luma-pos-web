CREATE TYPE "public"."paper_size" AS ENUM('a4', 'a5', 'k80');--> statement-breakpoint
CREATE TYPE "public"."print_doc_type" AS ENUM('order', 'quote', 'purchase', 'return', 'receipt');--> statement-breakpoint
CREATE TABLE "print_templates" (
	"doc_type" "print_doc_type" PRIMARY KEY NOT NULL,
	"paper_default" "paper_size" DEFAULT 'a5' NOT NULL,
	"store_name" text DEFAULT '' NOT NULL,
	"store_address" text DEFAULT '' NOT NULL,
	"store_phone" text DEFAULT '' NOT NULL,
	"store_tax_code" text DEFAULT '' NOT NULL,
	"footer_note" text DEFAULT '' NOT NULL,
	"options" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
