/*
  # Create cash movements and vales tables

  1. New Tables
    - `cash_movements`
      - `id` (uuid, primary key)
      - `fecha` (date)
      - `tipo` (text, enum)
      - `monto` (numeric)
      - `cargo` (text)
      - `numero_caja` (text)
      - `descripcion` (text)
      - `usuario` (text)
      - `created_at` (timestamp)
    - `vales_devolucion`
      - `id` (uuid, primary key)
      - `folio_vale` (text, unique)
      - `folio_remision` (text)
      - `fecha_expedicion` (date)
      - `cliente` (text)
      - `importe` (numeric)
      - `disponible` (numeric)
      - `estatus` (text, enum)
      - `tipo` (text)
      - `factura` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users
*/

-- Create cash movements table
CREATE TABLE IF NOT EXISTS cash_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fecha date DEFAULT CURRENT_DATE,
  tipo text NOT NULL CHECK (tipo IN ('caja_mayor', 'deposito_bancario', 'gasto', 'pago_proveedor', 'prestamo', 'traspaso_caja', 'otros')),
  monto numeric(10,2) NOT NULL DEFAULT 0,
  cargo text NOT NULL,
  numero_caja text NOT NULL,
  descripcion text DEFAULT '',
  usuario text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create vales por devolucion table
CREATE TABLE IF NOT EXISTS vales_devolucion (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  folio_vale text UNIQUE NOT NULL,
  folio_remision text NOT NULL,
  fecha_expedicion date DEFAULT CURRENT_DATE,
  cliente text NOT NULL,
  importe numeric(10,2) NOT NULL DEFAULT 0,
  disponible numeric(10,2) NOT NULL DEFAULT 0,
  estatus text NOT NULL DEFAULT 'HABILITADO' CHECK (estatus IN ('HABILITADO', 'USADO', 'VENCIDO')),
  tipo text NOT NULL DEFAULT 'Devolución',
  factura text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE cash_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE vales_devolucion ENABLE ROW LEVEL SECURITY;

-- Create policies for cash_movements
CREATE POLICY "Users can manage cash movements"
  ON cash_movements
  FOR ALL
  TO authenticated
  USING (true);

-- Create policies for vales_devolucion
CREATE POLICY "Users can manage vales devolucion"
  ON vales_devolucion
  FOR ALL
  TO authenticated
  USING (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_cash_movements_fecha ON cash_movements(fecha);
CREATE INDEX IF NOT EXISTS idx_cash_movements_tipo ON cash_movements(tipo);
CREATE INDEX IF NOT EXISTS idx_cash_movements_numero_caja ON cash_movements(numero_caja);

CREATE INDEX IF NOT EXISTS idx_vales_devolucion_folio_vale ON vales_devolucion(folio_vale);
CREATE INDEX IF NOT EXISTS idx_vales_devolucion_estatus ON vales_devolucion(estatus);
CREATE INDEX IF NOT EXISTS idx_vales_devolucion_fecha ON vales_devolucion(fecha_expedicion);

-- Create trigger for updated_at on vales_devolucion
CREATE TRIGGER update_vales_devolucion_updated_at
  BEFORE UPDATE ON vales_devolucion
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();