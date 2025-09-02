/*
  # Fix Client Credit Limits

  1. Updates
    - Update existing clients with proper credit limits
    - Reset balances to 0 for clean testing
    - Set one client close to limit for testing

  2. Data Changes
    - Supermercado El Águila: $50,000 limit, $0 balance
    - Tienda La Esquina: $25,000 limit, $23,000 balance (close to limit)
    - Add more test clients if needed
*/

-- Update existing clients with proper credit limits
UPDATE clients 
SET 
  credit_limit = 50000.00,
  balance = 0.00
WHERE name = 'Supermercado El Águila';

UPDATE clients 
SET 
  credit_limit = 25000.00,
  balance = 23000.00
WHERE name = 'Tienda La Esquina';

-- Insert additional test clients if they don't exist
INSERT INTO clients (name, rfc, address, phone, email, zone, credit_limit, balance)
VALUES 
  ('Abarrotes San Miguel', 'ASM123456789', 'Calle Principal 456', '555-111-2222', 'ventas@sanmiguel.com', 'Centro', 30000.00, 5000.00),
  ('Minisuper La Familia', 'MLF987654321', 'Av. Revolución 789', '555-333-4444', 'info@lafamilia.com', 'Norte', 15000.00, 0.00),
  ('Comercial Los Pinos', 'CLP456789123', 'Boulevard Sur 321', '555-555-6666', 'compras@lospinos.com', 'Sur', 40000.00, 8000.00)
ON CONFLICT (rfc) DO UPDATE SET
  credit_limit = EXCLUDED.credit_limit,
  balance = EXCLUDED.balance;