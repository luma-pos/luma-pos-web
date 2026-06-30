UPDATE "print_templates"
SET "options" = coalesce("options", '{}'::jsonb) || '{"showPaymentQr":true}'::jsonb
WHERE NOT ("options" ? 'showPaymentQr');
