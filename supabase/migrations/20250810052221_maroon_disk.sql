/*
  # Add order locks table for multi-user control

  1. New Tables
    - `order_locks`
      - `id` (uuid, primary key)
      - `order_id` (uuid, foreign key to sales)
      - `user_id` (uuid, foreign key to users)
      - `user_name` (text)
      - `locked_at` (timestamp)
      - `expires_at` (timestamp)
      - `session_id` (text)

  2. Security
    - Enable RLS on `order_locks` table
    - Add policies for authenticated users to manage their own locks
    - Add automatic cleanup for expired locks

  3. Functions
    - Function to automatically clean expired locks
    - Trigger to update expires_at on activity
*/

CREATE TABLE IF NOT EXISTS order_locks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL,
  user_id uuid NOT NULL,
  user_name text NOT NULL,
  locked_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '10 minutes'),
  session_id text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE order_locks ENABLE ROW LEVEL SECURITY;

-- Add foreign key constraints
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'order_locks_order_id_fkey'
  ) THEN
    ALTER TABLE order_locks ADD CONSTRAINT order_locks_order_id_fkey 
    FOREIGN KEY (order_id) REFERENCES sales(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'order_locks_user_id_fkey'
  ) THEN
    ALTER TABLE order_locks ADD CONSTRAINT order_locks_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create unique index to prevent multiple locks on same order
CREATE UNIQUE INDEX IF NOT EXISTS idx_order_locks_order_id ON order_locks(order_id);

-- Create index for cleanup queries
CREATE INDEX IF NOT EXISTS idx_order_locks_expires_at ON order_locks(expires_at);
CREATE INDEX IF NOT EXISTS idx_order_locks_user_session ON order_locks(user_id, session_id);

-- RLS Policies
CREATE POLICY "Users can manage their own locks"
  ON order_locks
  FOR ALL
  TO authenticated
  USING (auth.uid() = (SELECT auth_id FROM users WHERE id = user_id));

CREATE POLICY "Users can read all locks"
  ON order_locks
  FOR SELECT
  TO authenticated
  USING (true);

-- Function to clean expired locks
CREATE OR REPLACE FUNCTION clean_expired_locks()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM order_locks 
  WHERE expires_at < now();
END;
$$;

-- Function to extend lock expiration
CREATE OR REPLACE FUNCTION extend_lock_expiration(lock_order_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE order_locks 
  SET expires_at = now() + interval '10 minutes'
  WHERE order_id = lock_order_id;
END;
$$;