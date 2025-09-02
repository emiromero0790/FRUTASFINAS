/*
  # Add 5 price levels to products table

  1. New Columns
    - `price1` (numeric, default 0) - General price
    - `price2` (numeric, default 0) - Wholesale price  
    - `price3` (numeric, default 0) - Distributor price
    - `price4` (numeric, default 0) - VIP price
    - `price5` (numeric, default 0) - Special price

  2. Data Migration
    - Copy existing `price` values to `price1`
    - Calculate other price levels based on price1

  3. Updates
    - Update existing products with calculated prices
*/

-- Add the 5 price columns to products table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'price1'
  ) THEN
    ALTER TABLE products ADD COLUMN price1 numeric(10,2) DEFAULT 0;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'price2'
  ) THEN
    ALTER TABLE products ADD COLUMN price2 numeric(10,2) DEFAULT 0;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'price3'
  ) THEN
    ALTER TABLE products ADD COLUMN price3 numeric(10,2) DEFAULT 0;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'price4'
  ) THEN
    ALTER TABLE products ADD COLUMN price4 numeric(10,2) DEFAULT 0;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'price5'
  ) THEN
    ALTER TABLE products ADD COLUMN price5 numeric(10,2) DEFAULT 0;
  END IF;
END $$;

-- Migrate existing price data to the new price levels
UPDATE products 
SET 
  price1 = price,
  price2 = price * 1.1,
  price3 = price * 1.2,
  price4 = price * 1.3,
  price5 = price * 1.4
WHERE price1 = 0 OR price1 IS NULL;