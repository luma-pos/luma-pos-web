-- Onboarding flag (spec Part 21). Idempotent, áp dụng thủ công.
ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS onboarded boolean NOT NULL DEFAULT false;

-- Cửa hàng hiện tại đã hoạt động → đánh dấu đã onboard (không ép qua wizard).
-- Cài đặt mới (chưa có row store_settings) sẽ có onboarded=false → hiện wizard.
UPDATE store_settings SET onboarded = true;
