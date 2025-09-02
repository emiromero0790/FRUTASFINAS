/*
  # Create catalogos tables

  1. New Tables
    - `expense_concepts`
      - `id` (uuid, primary key)
      - `nombre` (text)
      - `categoria` (text)
      - `descripcion` (text)
      - `activo` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `bank_accounts`
      - `id` (uuid, primary key)
      - `banco` (text)
      - `numero_cuenta` (text)
      - `tipo` (text)
      - `saldo` (numeric)
      - `activa` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users
*/

CREATE TABLE IF NOT EXISTS expense_concepts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  categoria text NOT NULL,
  descripcion text DEFAULT '',
  activo boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS bank_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  banco text NOT NULL,
  numero_cuenta text NOT NULL,
  tipo text NOT NULL,
  saldo numeric(10,2) DEFAULT 0,
  activa boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE expense_concepts ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage expense concepts"
  ON expense_concepts
  FOR ALL
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage bank accounts"
  ON bank_accounts
  FOR ALL
  TO authenticated
  USING (true);

-- Create updated_at triggers
CREATE TRIGGER update_expense_concepts_updated_at
  BEFORE UPDATE ON expense_concepts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bank_accounts_updated_at
  BEFORE UPDATE ON bank_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();