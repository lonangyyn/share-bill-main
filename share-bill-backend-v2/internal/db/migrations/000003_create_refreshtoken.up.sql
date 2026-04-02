CREATE TABLE IF NOT EXISTS sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_uuid uuid NOT NULL,
  refresh_token varchar NOT NULL,
  user_agent varchar NOT NULL,
  client_ip varchar NOT NULL,
  is_blocked boolean NOT NULL DEFAULT false,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Reference the unique user_uuid column for referential integrity
ALTER TABLE sessions ADD CONSTRAINT sessions_user_uuid_fkey FOREIGN KEY (user_uuid) REFERENCES users(user_uuid) ON DELETE CASCADE;

-- Helpful indexes for lookups and cleanup
CREATE INDEX IF NOT EXISTS idx_sessions_user_uuid ON sessions(user_uuid);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
CREATE UNIQUE INDEX IF NOT EXISTS idx_sessions_refresh_token ON sessions(refresh_token);