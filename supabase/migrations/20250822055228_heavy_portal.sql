/*
  # Fix users table INSERT policy

  1. Security Changes
    - Update INSERT policy on users table to allow authenticated users to create new users
    - Maintain existing SELECT and UPDATE policies
    - Allow admins to create new user accounts

  2. Policy Updates
    - Modified INSERT policy to allow authenticated users to insert new records
    - Ensures proper access control while enabling user creation functionality
*/

-- Drop existing INSERT policy if it exists
DROP POLICY IF EXISTS "Users can insert new users" ON users;

-- Create new INSERT policy that allows authenticated users to create new users
CREATE POLICY "Users can insert new users"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Update existing policies to ensure they work correctly
DROP POLICY IF EXISTS "Users can update own profile" ON users;

CREATE POLICY "Users can update own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = auth_id OR EXISTS (
    SELECT 1 FROM users 
    WHERE auth_id = auth.uid() AND role = 'Admin'
  ))
  WITH CHECK (auth.uid() = auth_id OR EXISTS (
    SELECT 1 FROM users 
    WHERE auth_id = auth.uid() AND role = 'Admin'
  ));

-- Ensure SELECT policy allows reading all users for authenticated users
DROP POLICY IF EXISTS "Users can read all data" ON users;

CREATE POLICY "Users can read all data"
  ON users
  FOR SELECT
  TO authenticated
  USING (true);