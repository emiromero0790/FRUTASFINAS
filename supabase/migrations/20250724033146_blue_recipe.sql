/*
  # Create purchase orders tables

  1. New Tables
    - `purchase_orders`
      - `id` (uuid, primary key)
      - `supplier_id` (uuid, foreign key to suppliers)
      - `supplier_name` (text)
      - `date` (date)
      - `total` (numeric)
      - `status` (text with check constraint)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `purchase_order_items`
      - `id` (uuid, primary key)
      - `purchase_order_id` (uuid, foreign key)
      - `product_id` (uuid, foreign key to products)
      - `product_name` (text)
      - `quantity` (integer)
      - `cost` (numeric)
      - `total` (numeric)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users
*/

CREATE TABLE IF NOT EXISTS purchase_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid REFERENCES suppliers(id) ON DELETE CASCADE,
  supplier_name text NOT NULL,
  date date DEFAULT CURRENT_DATE,
  total numeric(10,2) DEFAULT 0,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT purchase_orders_status_check CHECK (status IN ('pending', 'approved', 'received', 'cancelled'))
);

CREATE TABLE IF NOT EXISTS purchase_order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id uuid REFERENCES purchase_orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  product_name text NOT NULL,
  quantity integer DEFAULT 1,
  cost numeric(10,2) DEFAULT 0,
  total numeric(10,2) DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage purchase orders"
  ON purchase_orders
  FOR ALL
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage purchase order items"
  ON purchase_order_items
  FOR ALL
  TO authenticated
  USING (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier_id ON purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_date ON purchase_orders(date);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_status ON purchase_orders(status);
CREATE INDEX IF NOT EXISTS idx_purchase_order_items_order_id ON purchase_order_items(purchase_order_id);

-- Create updated_at trigger
CREATE TRIGGER update_purchase_orders_updated_at
  BEFORE UPDATE ON purchase_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();