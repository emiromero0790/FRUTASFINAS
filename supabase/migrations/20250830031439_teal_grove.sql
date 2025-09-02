/*
  # Remove saldo column from bank_accounts table

  1. Changes
    - Remove `saldo` column from `bank_accounts` table
    - This column is not needed as balances are tracked in bank_movements

  2. Security
    - No changes to RLS policies needed
*/

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bank_accounts' AND column_name = 'saldo'
  ) THEN
    ALTER TABLE bank_accounts DROP COLUMN saldo;
  END IF;
END $$;