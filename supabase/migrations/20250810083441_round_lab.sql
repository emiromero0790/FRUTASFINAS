/*
  # Update quantity columns to support decimal values

  1. Changes Made
    - Change `sale_items.quantity` from integer to numeric(10,3)
    - Change `purchase_order_items.quantity` from integer to numeric(10,3) 
    - Change `inventory_movements.quantity` from integer to numeric(10,3)

  2. Security
    - No RLS changes needed as these are column type updates

  3. Notes
    - Using numeric(10,3) to support up to 7 digits before decimal and 3 after
    - This supports weighted products like grains, oils, etc.
*/

-- Update sale_items quantity column to support decimals
ALTER TABLE sale_items 
ALTER COLUMN quantity TYPE numeric(10,3);

-- Update purchase_order_items quantity column to support decimals  
ALTER TABLE purchase_order_items
ALTER COLUMN quantity TYPE numeric(10,3);

-- Update inventory_movements quantity column to support decimals
ALTER TABLE inventory_movements
ALTER COLUMN quantity TYPE numeric(10,3);