/*
  # Add 'saved' status to sales table

  1. Changes
    - Update sales table status constraint to include 'saved' status
    - This allows orders to be saved with 'saved' status instead of 'pending'
    - Differentiates between saved orders and credit orders

  2. Security
    - No changes to RLS policies needed
    - Existing policies will work with new status
*/

-- Update the status check constraint to include 'saved'
ALTER TABLE sales DROP CONSTRAINT IF EXISTS sales_status_check;

ALTER TABLE sales ADD CONSTRAINT sales_status_check 
  CHECK (status = ANY (ARRAY['pending'::text, 'paid'::text, 'overdue'::text, 'saved'::text]));