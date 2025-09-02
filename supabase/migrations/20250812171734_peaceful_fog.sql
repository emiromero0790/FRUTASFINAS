/*
  # Create payments table for order payments tracking

  1. New Tables
    - `payments`
      - `id` (uuid, primary key)
      - `sale_id` (uuid, foreign key to sales)
      - `amount` (numeric, payment amount)
      - `payment_method` (text, payment method)
      - `reference` (text, payment reference)
      - `date` (date, payment date)
      - `created_by` (uuid, foreign key to users)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `payments` table
    - Add policies for authenticated users to manage payments

  3. Changes
    - Add `amount_paid` column to sales table to track total payments
    - Add `remaining_balance` column to sales table for quick balance lookup
*/

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id uuid NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  amount numeric(10,2) NOT NULL DEFAULT 0,
  payment_method text NOT NULL DEFAULT 'cash',
  reference text DEFAULT '',
  date date DEFAULT CURRENT_DATE,
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now()
);

-- Add payment tracking columns to sales table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sales' AND column_name = 'amount_paid'
  ) THEN
    ALTER TABLE sales ADD COLUMN amount_paid numeric(10,2) DEFAULT 0;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sales' AND column_name = 'remaining_balance'
  ) THEN
    ALTER TABLE sales ADD COLUMN remaining_balance numeric(10,2) DEFAULT 0;
  END IF;
END $$;

-- Enable RLS
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Create policies for payments
CREATE POLICY "Users can manage payments"
  ON payments
  FOR ALL
  TO authenticated
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_payments_sale_id ON payments(sale_id);
CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(date);
CREATE INDEX IF NOT EXISTS idx_payments_created_by ON payments(created_by);

-- Update existing sales to set remaining_balance = total for unpaid sales
UPDATE sales 
SET remaining_balance = total 
WHERE status IN ('pending', 'draft') AND remaining_balance = 0;

-- Update existing sales to set remaining_balance = 0 for paid sales
UPDATE sales 
SET remaining_balance = 0 
WHERE status = 'paid' AND remaining_balance != 0;