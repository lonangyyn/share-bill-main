CREATE TABLE IF NOT EXISTS user_bank_accounts (
  bank_account_id BIGSERIAL PRIMARY KEY,
  bank_account_uuid UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),

  user_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,

  bank_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  account_owner TEXT NOT NULL,

  is_default BOOLEAN NOT NULL DEFAULT FALSE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- mỗi user chỉ có 1 default
CREATE UNIQUE INDEX IF NOT EXISTS ux_user_default_bank
ON user_bank_accounts(user_id)
WHERE is_default = TRUE;

-- OPTIONAL: migrate bank cũ từ users sang bảng mới (không phá logic cũ)
INSERT INTO user_bank_accounts(user_id, bank_name, account_number, account_owner, is_default)
SELECT user_id, bank_name, bank_account, bank_owner, TRUE
FROM users
WHERE bank_name IS NOT NULL AND bank_account IS NOT NULL AND bank_owner IS NOT NULL;
