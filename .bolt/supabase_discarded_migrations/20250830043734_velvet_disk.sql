/*
  # Create pending orders system for warehouse distribution

  1. New Tables
    - `pending_orders`
      - `id` (uuid, primary key)
      - `temp_order_id` (text, unique temporary identifier)
      - `user_id` (uuid, foreign key to users)
      - `client_id` (uuid, nullable)
      - `client_name` (text)
      - `status` (text, default 'pending')
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `pending_order_items`
      - `id` (uuid, primary key)
      - `pending_order_id` (uuid, foreign key)
      - `product_id` (uuid, foreign key)
      - `product_name` (text)
      - `quantity` (numeric)
      - `unit_price` (numeric)
      - `total` (numeric)
      - `warehouse_distribution` (jsonb)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to manage their own pending orders
</sql>

CREATE TABLE IF NOT EXISTS pending_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  temp_order_id text UNIQUE NOT NULL,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
  client_name text NOT NULL,
  observations text DEFAULT '',
  driver text DEFAULT '',
  route text DEFAULT '',
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pending_order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pending_order_id uuid REFERENCES pending_orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  product_name text NOT NULL,
  product_code text NOT NULL,
  quantity numeric(10,3) NOT NULL,
  price_level integer NOT NULL CHECK (price_level BETWEEN 1 AND 5),
  unit_price numeric(10,2) NOT NULL,
  total numeric(10,2) NOT NULL,
  warehouse_distribution jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE pending_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE pending_order_items ENABLE ROW LEVEL SECURITY;

-- Policies for pending_orders
CREATE POLICY "Users can manage their own pending orders"
  ON pending_orders
  FOR ALL
  TO authenticated
  USING (user_id = (SELECT id FROM users WHERE auth_id = auth.uid()))
  WITH CHECK (user_id = (SELECT id FROM users WHERE auth_id = auth.uid()));

-- Policies for pending_order_items
CREATE POLICY "Users can manage their own pending order items"
  ON pending_order_items
  FOR ALL
  TO authenticated
  USING (
    pending_order_id IN (
      SELECT id FROM pending_orders 
      WHERE user_id = (SELECT id FROM users WHERE auth_id = auth.uid())
    )
  )
  WITH CHECK (
    pending_order_id IN (
      SELECT id FROM pending_orders 
      WHERE user_id = (SELECT id FROM users WHERE auth_id = auth.uid())
    )
  );

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_pending_orders_updated_at
  BEFORE UPDATE ON pending_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();