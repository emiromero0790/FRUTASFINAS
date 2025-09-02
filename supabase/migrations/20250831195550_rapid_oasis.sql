/*
  # Create order warehouse distribution table

  1. New Tables
    - `order_warehouse_distribution`
      - `id` (uuid, primary key)
      - `order_id` (uuid, foreign key to sales)
      - `product_id` (uuid, foreign key to products)
      - `warehouse_id` (uuid, foreign key to almacenes)
      - `warehouse_name` (text)
      - `quantity` (numeric)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `order_warehouse_distribution` table
    - Add policy for authenticated users to manage their own distributions
*/

CREATE TABLE IF NOT EXISTS order_warehouse_distribution (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  warehouse_id uuid NOT NULL REFERENCES almacenes(id) ON DELETE CASCADE,
  warehouse_name text NOT NULL,
  quantity numeric(10,3) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE order_warehouse_distribution ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage warehouse distributions"
  ON order_warehouse_distribution
  FOR ALL
  TO authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS idx_order_warehouse_distribution_order_id 
  ON order_warehouse_distribution(order_id);

CREATE INDEX IF NOT EXISTS idx_order_warehouse_distribution_product_id 
  ON order_warehouse_distribution(product_id);

CREATE INDEX IF NOT EXISTS idx_order_warehouse_distribution_warehouse_id 
  ON order_warehouse_distribution(warehouse_id);