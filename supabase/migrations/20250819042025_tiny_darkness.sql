/*
  # Add default_price_level column to clients table

  1. Changes
    - Add `default_price_level` column to `clients` table
    - Set default value to 1 (Precio 1 - General)
    - Add check constraint to ensure valid price levels (1-5)

  2. Security
    - No changes to RLS policies needed
*/

-- Add default_price_level column to clients table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clients' AND column_name = 'default_price_level'
  ) THEN
    ALTER TABLE clients ADD COLUMN default_price_level integer DEFAULT 1;
    
    -- Add check constraint to ensure valid price levels
    ALTER TABLE clients ADD CONSTRAINT clients_default_price_level_check 
    CHECK (default_price_level >= 1 AND default_price_level <= 5);
  END IF;
END $$;