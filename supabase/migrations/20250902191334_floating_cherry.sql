/*
  # Create bank_accounts table

  1. New Tables
    - `bank_accounts`
      - `id` (uuid, primary key)
      - `banco` (text, bank name)
      - `numero_cuenta` (text, account number)
      - `tipo` (text, account type)
      - `saldo` (numeric, account balance)
      - `activa` (boolean, active status)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `bank_accounts` table
    - Add policy for authenticated users to manage bank accounts
*/

CREATE TABLE IF NOT EXISTS bank_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  banco text NOT NULL,
  numero_cuenta text NOT NULL,
  tipo text NOT NULL DEFAULT 'Ahorro',
  saldo numeric(15,2) DEFAULT 0,
  activa boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage bank accounts"
  ON bank_accounts
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create trigger for updated_at
CREATE TRIGGER update_bank_accounts_updated_at
  BEFORE UPDATE ON bank_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_bank_accounts_banco ON bank_accounts(banco);
CREATE INDEX IF NOT EXISTS idx_bank_accounts_activa ON bank_accounts(activa);