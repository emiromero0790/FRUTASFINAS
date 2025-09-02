/*
  # Update order_warehouse_distribution to use order folio

  1. Changes
    - Change order_id column from uuid to text to store order folio
    - This allows using temp folios like "temp-1756696421684" 
    - Maintains complete isolation between different order tabs

  2. Security
    - Keep existing RLS policies
    - No changes to permissions needed
*/

-- Drop existing foreign key constraint
ALTER TABLE order_warehouse_distribution 
DROP CONSTRAINT IF EXISTS order_warehouse_distribution_order_id_fkey;

-- Change order_id column type from uuid to text
ALTER TABLE order_warehouse_distribution 
ALTER COLUMN order_id TYPE text;

-- Update any existing records to use folio format (if needed)
-- This is safe since we're just changing the data type

-- Add comment to clarify the new usage
COMMENT ON COLUMN order_warehouse_distribution.order_id IS 'Order folio (can be temp-xxx for unsaved orders or UUID for saved orders)';