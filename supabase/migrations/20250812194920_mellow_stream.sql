/*
  # Create Warehouse System

  1. New Tables
    - `almacenes`
      - `id` (uuid, primary key)
      - `nombre` (text, unique)
      - `ubicacion` (text)
      - `activo` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    - `stock_almacenes`
      - `id` (uuid, primary key)
      - `almacen_id` (uuid, foreign key)
      - `product_id` (uuid, foreign key)
      - `stock` (integer)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    - `traspasos_almacenes`
      - `id` (uuid, primary key)
      - `almacen_origen_id` (uuid, foreign key)
      - `almacen_destino_id` (uuid, foreign key)
      - `product_id` (uuid, foreign key)
      - `cantidad` (integer)
      - `fecha` (date)
      - `referencia` (text)
      - `notas` (text)
      - `estatus` (text)
      - `created_by` (uuid, foreign key)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create almacenes table
CREATE TABLE IF NOT EXISTS almacenes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text UNIQUE NOT NULL,
  ubicacion text DEFAULT '',
  activo boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create stock_almacenes table
CREATE TABLE IF NOT EXISTS stock_almacenes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  almacen_id uuid NOT NULL REFERENCES almacenes(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  stock integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(almacen_id, product_id)
);

-- Create traspasos_almacenes table
CREATE TABLE IF NOT EXISTS traspasos_almacenes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  almacen_origen_id uuid NOT NULL REFERENCES almacenes(id) ON DELETE CASCADE,
  almacen_destino_id uuid NOT NULL REFERENCES almacenes(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  cantidad integer NOT NULL,
  fecha date DEFAULT CURRENT_DATE,
  referencia text DEFAULT '',
  notas text DEFAULT '',
  estatus text DEFAULT 'pendiente' CHECK (estatus IN ('pendiente', 'en_transito', 'completado', 'cancelado')),
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE almacenes ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_almacenes ENABLE ROW LEVEL SECURITY;
ALTER TABLE traspasos_almacenes ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage almacenes"
  ON almacenes
  FOR ALL
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage stock_almacenes"
  ON stock_almacenes
  FOR ALL
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage traspasos_almacenes"
  ON traspasos_almacenes
  FOR ALL
  TO authenticated
  USING (true);

-- Create triggers for updated_at
CREATE TRIGGER update_almacenes_updated_at
  BEFORE UPDATE ON almacenes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stock_almacenes_updated_at
  BEFORE UPDATE ON stock_almacenes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default warehouses
INSERT INTO almacenes (nombre, ubicacion, activo) VALUES
('Almacén Principal', 'Planta Baja', true),
('Almacén B', 'Primer Piso', true),
('Almacén de Productos Terminados', 'Bodega A', true)
ON CONFLICT (nombre) DO NOTHING;

-- Initialize stock for existing products in main warehouse
DO $$
DECLARE
  main_warehouse_id uuid;
  product_record RECORD;
BEGIN
  -- Get main warehouse ID
  SELECT id INTO main_warehouse_id FROM almacenes WHERE nombre = 'Almacén Principal' LIMIT 1;
  
  -- Insert stock for all existing products in main warehouse
  FOR product_record IN SELECT id, stock FROM products WHERE status = 'active'
  LOOP
    INSERT INTO stock_almacenes (almacen_id, product_id, stock)
    VALUES (main_warehouse_id, product_record.id, product_record.stock)
    ON CONFLICT (almacen_id, product_id) DO UPDATE SET stock = product_record.stock;
  END LOOP;
END $$;