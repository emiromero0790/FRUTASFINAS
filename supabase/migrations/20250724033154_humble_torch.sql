/*
  # Create bank movements table

  1. New Tables
    - `bank_movements`
      - `id` (uuid, primary key)
      - `fecha` (date)
      - `banco` (text)
      - `cuenta` (text)
      - `tipo` (text with check constraint)
      - `concepto` (text)
      - `monto` (numeric)
      - `saldo_anterior` (numeric)
      - `saldo_nuevo` (numeric)
      - `referencia` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on table
    - Add policies for authenticated users
*/

CREATE TABLE IF NOT EXISTS bank_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fecha date DEFAULT CURRENT_DATE,
  banco text NOT NULL,
  cuenta text NOT NULL,
  tipo text NOT NULL,
  concepto text NOT NULL,
  monto numeric(10,2) NOT NULL,
  saldo_anterior numeric(10,2) DEFAULT 0,
  saldo_nuevo numeric(10,2) DEFAULT 0,
  referencia text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  CONSTRAINT bank_movements_tipo_check CHECK (tipo IN ('deposito', 'retiro', 'transferencia', 'comision'))
);

-- Enable RLS
ALTER TABLE bank_movements ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage bank movements"
  ON bank_movements
  FOR ALL
  TO authenticated
  USING (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_bank_movements_fecha ON bank_movements(fecha);
CREATE INDEX IF NOT EXISTS idx_bank_movements_banco ON bank_movements(banco);
CREATE INDEX IF NOT EXISTS idx_bank_movements_tipo ON bank_movements(tipo);