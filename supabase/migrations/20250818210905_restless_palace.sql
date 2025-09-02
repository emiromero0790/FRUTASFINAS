/*
  # Create remisiones table

  1. New Tables
    - `remisiones`
      - `id` (uuid, primary key)
      - `folio` (text, unique)
      - `folio_remision` (text, unique)
      - `sale_id` (uuid, foreign key to sales)
      - `fecha` (date)
      - `importe` (numeric)
      - `cliente` (text)
      - `estatus` (text)
      - `tipo_pago` (text)
      - `forma_pago` (text)
      - `caja` (text)
      - `dev` (text)
      - `factura` (text)
      - `vendedor` (text)
      - `cajero` (text)
      - `observaciones` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `remisiones` table
    - Add policy for authenticated users to manage remisiones
*/

CREATE TABLE IF NOT EXISTS remisiones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  folio text UNIQUE NOT NULL,
  folio_remision text UNIQUE NOT NULL,
  sale_id uuid REFERENCES sales(id) ON DELETE CASCADE,
  fecha date DEFAULT CURRENT_DATE,
  importe numeric(10,2) DEFAULT 0,
  cliente text NOT NULL,
  estatus text DEFAULT 'CERRADA',
  tipo_pago text DEFAULT 'Contado',
  forma_pago text DEFAULT 'Efectivo',
  caja text DEFAULT 'CAJA-01',
  dev text DEFAULT 'NO',
  factura text DEFAULT '',
  vendedor text DEFAULT '',
  cajero text DEFAULT '',
  observaciones text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE remisiones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage remisiones"
  ON remisiones
  FOR ALL
  TO authenticated
  USING (true);

CREATE TRIGGER update_remisiones_updated_at
  BEFORE UPDATE ON remisiones
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_remisiones_sale_id ON remisiones(sale_id);
CREATE INDEX IF NOT EXISTS idx_remisiones_fecha ON remisiones(fecha);
CREATE INDEX IF NOT EXISTS idx_remisiones_cliente ON remisiones(cliente);