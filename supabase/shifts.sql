-- Shift & cash management (Quản lý ca — spec Part 17). Idempotent, áp dụng thủ công.
CREATE TABLE IF NOT EXISTS shifts (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code          varchar(30) NOT NULL UNIQUE,
  user_id       uuid REFERENCES profiles(id),
  opening_float numeric(14,2) NOT NULL DEFAULT 0,
  opened_at     timestamptz NOT NULL DEFAULT now(),
  closed_at     timestamptz,
  expected_cash numeric(14,2),
  counted_cash  numeric(14,2),
  variance      numeric(14,2),
  status        text NOT NULL DEFAULT 'open',
  note          text,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS shifts_status_idx ON shifts(status);
CREATE INDEX IF NOT EXISTS shifts_user_idx ON shifts(user_id);
