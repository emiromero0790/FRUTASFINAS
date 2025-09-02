/*
  # Add warehouse transfers functionality

  1. New Tables
    - `warehouses`
      - `id` (uuid, primary key)
      - `name` (text, unique)
      - `location` (text)
      - `active` (boolean, default true)
    - `warehouse_stock`
      - `id` (uuid, primary key)
      - `warehouse_id` (uuid, foreign key)
      - `product_id` (uuid, foreign key)
      - `stock` (integer, default 0)
    - `warehouse_transfers`
      - `id` (uuid, primary key)
      - `from_warehouse_id` (uuid, foreign key)
      - `to_warehouse_id` (uuid, foreign key)
      - `product_id` (uuid, foreign key)
      - `quantity` (integer)
      - `status` (text, check constraint)
      - `date` (date, default current_date)
      - `reference` (text)
      - `notes` (text)
      - `created_by` (uuid, foreign key)

  2. Security
    - Enable RLS on all new tables
    - Add policies for authenticated users to manage transfers
</sql>

CREATE TABLE IF NOT EXISTS warehouses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  location text DEFAULT '',
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS warehouse_stock (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  warehouse_id uuid NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  stock integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(warehouse_id, product_id)
);

CREATE TABLE IF NOT EXISTS warehouse_transfers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_warehouse_id uuid NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
  to_warehouse_id uuid NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  product_name text NOT NULL,
  quantity integer NOT NULL,
  status text DEFAULT 'pending',
  date date DEFAULT CURRENT_DATE,
  reference text DEFAULT '',
  notes text DEFAULT '',
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT warehouse_transfers_status_check CHECK (status = ANY (ARRAY['pending'::text, 'in_transit'::text, 'completed'::text, 'cancelled'::text]))
);

-- Enable RLS
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouse_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouse_transfers ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can manage warehouses"
  ON warehouses
  FOR ALL
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage warehouse stock"
  ON warehouse_stock
  FOR ALL
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage warehouse transfers"
  ON warehouse_transfers
  FOR ALL
  TO authenticated
  USING (true);

-- Triggers for updated_at
CREATE TRIGGER update_warehouses_updated_at
  BEFORE UPDATE ON warehouses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_warehouse_stock_updated_at
  BEFORE UPDATE ON warehouse_stock
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_warehouse_transfers_updated_at
  BEFORE UPDATE ON warehouse_transfers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default warehouses
INSERT INTO warehouses (name, location) VALUES
  ('BODEGA-PRINCIPAL', 'Almacén Central'),
  ('SUCURSAL-CENTRO', 'Centro de la Ciudad'),
  ('SUCURSAL-NORTE', 'Zona Norte'),
  ('SUCURSAL-SUR', 'Zona Sur')
ON CONFLICT (name) DO NOTHING;