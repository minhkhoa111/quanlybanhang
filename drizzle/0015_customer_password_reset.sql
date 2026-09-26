CREATE TABLE IF NOT EXISTS customer_password_reset_sessions (
  id TEXT PRIMARY KEY NOT NULL,
  customer_id TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  channel TEXT NOT NULL,
  destination TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  verified_at INTEGER NOT NULL DEFAULT 0,
  attempts INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS customer_password_reset_token_idx
  ON customer_password_reset_sessions(token_hash);

CREATE INDEX IF NOT EXISTS customer_password_reset_customer_idx
  ON customer_password_reset_sessions(customer_id, created_at DESC);
