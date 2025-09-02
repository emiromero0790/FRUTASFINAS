/*
  # Update client credit limits for testing

  1. Changes
    - Update existing clients to have realistic credit limits
    - Keep balance at 0 for testing
    - Set one client close to limit for testing credit validation
  
  2. Test Data
    - Supermercado El Águila: $50,000 limit
    - Tienda La Esquina: $25,000 limit, $23,000 balance (close to limit)
*/

-- Update credit limits for existing clients
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
  ('Abarrotes San Miguel', 'ASM123456789', 'Calle Principal 456', '555-111-2222', 'contacto@sanmiguel.com', 'Centro', 15000.00, 0.00),
  ('Distribuidora Norte', 'DNO987654321', 'Av. Industrial 789', '555-333-4444', 'ventas@disnorte.com', 'Norte', 75000.00, 5000.00)
ON CONFLICT (rfc) DO UPDATE SET
  credit_limit = EXCLUDED.credit_limit,
  balance = EXCLUDED.balance;