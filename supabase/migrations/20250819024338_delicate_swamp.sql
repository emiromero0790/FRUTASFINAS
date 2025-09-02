/*
  # Create admin notifications table

  1. New Tables
    - `admin_notifications`
      - `id` (uuid, primary key)
      - `type` (text, notification type)
      - `title` (text, notification title)
      - `message` (text, notification message)
      - `data` (jsonb, additional data)
      - `read` (boolean, read status)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
  2. Security
    - Enable RLS on `admin_notifications` table
    - Add policy for admin users to read all notifications
    - Add policy for system to insert notifications
*/

CREATE TABLE IF NOT EXISTS admin_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  data jsonb DEFAULT '{}',
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin users can read all notifications"
  ON admin_notifications
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.auth_id = auth.uid() 
      AND users.role = 'Admin'
    )
  );

CREATE POLICY "System can insert notifications"
  ON admin_notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admin users can update notifications"
  ON admin_notifications
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.auth_id = auth.uid() 
      AND users.role = 'Admin'
    )
  );

-- Create trigger for updated_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers
    WHERE trigger_name = 'update_admin_notifications_updated_at'
  ) THEN
    CREATE TRIGGER update_admin_notifications_updated_at
      BEFORE UPDATE ON admin_notifications
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;