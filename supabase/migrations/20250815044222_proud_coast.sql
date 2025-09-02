/*
  # Fix cash registers RLS policy for INSERT operations

  1. Security Changes
    - Add INSERT policy for cash_registers table
    - Allow authenticated users to create cash register records
    - Ensure users can only create records for themselves

  2. Policy Details
    - Policy name: "Users can create their own cash registers"
    - Allows INSERT operations for authenticated users
    - Restricts creation to user's own records via auth.uid() = user_id
*/

-- Add INSERT policy for cash_registers table
CREATE POLICY "Users can create their own cash registers"
  ON cash_registers
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = (
      SELECT auth_id FROM users WHERE id = user_id
    )
  );

-- Also add UPDATE policy to allow users to update their own cash registers
CREATE POLICY "Users can update their own cash registers"
  ON cash_registers
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = (
      SELECT auth_id FROM users WHERE id = user_id
    )
  )
  WITH CHECK (
    auth.uid() = (
      SELECT auth_id FROM users WHERE id = user_id
    )
  );