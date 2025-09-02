/*
  # Drop order_warehouse_distribution table

  1. Changes
    - Drop the order_warehouse_distribution table and related objects
    - Remove triggers and functions related to warehouse distribution
    - Clean up any dependencies

  2. Reason
    - Warehouse distribution will now be handled in localStorage
    - Distribution will be processed only at payment confirmation
*/

-- Drop the trigger first
DROP TRIGGER IF EXISTS validate_folio_before_insert ON order_warehouse_distribution;

-- Drop the validation function
DROP FUNCTION IF EXISTS validate_folio_consistency();

-- Drop the table
DROP TABLE IF EXISTS order_warehouse_distribution;

-- Drop any other related functions
DROP FUNCTION IF EXISTS get_warehouse_distribution_by_folio(text);
DROP FUNCTION IF EXISTS validate_order_distribution(text);