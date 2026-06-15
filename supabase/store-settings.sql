-- Store settings (singleton) — Wire Settings: Store profile.
-- Áp dụng thủ công (ngoài drizzle). Idempotent.

CREATE TABLE IF NOT EXISTS store_settings (
  id         text PRIMARY KEY DEFAULT 'default',
  name       text NOT NULL DEFAULT '',
  address    text NOT NULL DEFAULT '',
  phone      text NOT NULL DEFAULT '',
  tax_code   text NOT NULL DEFAULT '',
  industry   text NOT NULL DEFAULT 'grocery',
  currency   text NOT NULL DEFAULT 'VND',
  locale     text NOT NULL DEFAULT 'vi-VN',
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO store_settings (id) VALUES ('default') ON CONFLICT (id) DO NOTHING;
