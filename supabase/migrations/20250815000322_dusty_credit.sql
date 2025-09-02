/*
  # Update stock field to support decimal values

  1. Database Changes
    - Modify products table stock column to support decimal values
    - Update stock_almacenes table to support decimal values
    - Ensure inventory_movements quantity supports decimals

  2. Security
    - No changes to existing RLS policies needed
*/

-- Update products table to support decimal stock
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'stock' AND data_type = 'integer'
  ) THEN
    ALTER TABLE products ALTER COLUMN stock TYPE numeric(10,3);
  END IF;
END $$;

-- Update stock_almacenes table to support decimal stock
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stock_almacenes' AND column_name = 'stock' AND data_type = 'integer'
  ) THEN
    ALTER TABLE stock_almacenes ALTER COLUMN stock TYPE numeric(10,3);
  END IF;
END $$;

-- Update inventory_movements table to support decimal quantities
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'inventory_movements' AND column_name = 'quantity' AND data_type = 'integer'
  ) THEN
    ALTER TABLE inventory_movements ALTER COLUMN quantity TYPE numeric(10,3);
  END IF;
END $$;

-- Update traspasos_almacenes table to support decimal quantities
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'traspasos_almacenes' AND column_name = 'cantidad' AND data_type = 'integer'
  ) THEN
    ALTER TABLE traspasos_almacenes ALTER COLUMN cantidad TYPE numeric(10,3);
  END IF;
END $$;