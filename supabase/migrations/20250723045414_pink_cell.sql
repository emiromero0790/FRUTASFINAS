/*
  # Datos de Prueba para Sistema ERP DURAN

  1. Usuarios de prueba
  2. Productos de muestra
  3. Proveedores
  4. Clientes
  5. Ventas y gastos de ejemplo
*/

-- Insertar productos de muestra
INSERT INTO products (name, code, line, subline, unit, stock, cost, price, status) VALUES
('Aceite Comestible 1L', 'ACE001', 'Aceites', 'Comestibles', 'Litro', 150, 45.50, 65.00, 'active'),
('Arroz Blanco 1Kg', 'ARR001', 'Granos', 'Cereales', 'Kilogramo', 200, 22.00, 35.00, 'active'),
('Leche Entera 1L', 'LEC001', 'Lácteos', 'Leches', 'Litro', 80, 18.50, 28.00, 'active'),
('Frijol Negro 1Kg', 'FRI001', 'Granos', 'Leguminosas', 'Kilogramo', 120, 28.00, 42.00, 'active'),
('Azúcar Blanca 1Kg', 'AZU001', 'Endulzantes', 'Refinada', 'Kilogramo', 90, 15.00, 25.00, 'active');

-- Insertar proveedores
INSERT INTO suppliers (name, rfc, address, phone, email, contact) VALUES
('Distribuidora Nacional S.A.', 'DIN123456789', 'Av. Principal 123, Col. Centro', '555-123-4567', 'ventas@distribuidora.com', 'Juan Pérez'),
('Alimentos del Norte', 'ALN987654321', 'Boulevard Norte 456, Zona Industrial', '555-987-6543', 'pedidos@alimentosnorte.com', 'María González'),
('Comercializadora del Sur', 'CDS456789123', 'Calle Sur 789, Col. Industrial', '555-456-7890', 'compras@comsur.com', 'Carlos López');

-- Insertar clientes
INSERT INTO clients (name, rfc, address, phone, email, zone, credit_limit, balance) VALUES
('Supermercado El Águila', 'SEA456789123', 'Calle Comercio 789, Centro', '555-456-7890', 'compras@superaguila.com', 'Centro', 50000, 15000),
('Tienda La Esquina', 'TLE789123456', 'Av. Libertad 321, Colonia Norte', '555-321-0987', 'info@laesquina.com', 'Norte', 25000, 8500),
('Minisuper Familiar', 'MIF123789456', 'Calle Familia 654, Col. Sur', '555-654-3210', 'ventas@minifamiliar.com', 'Sur', 30000, 12000);

-- Insertar gastos de muestra
INSERT INTO expenses (concept, amount, date, category, bank_account, description) VALUES
('Pago de Luz', 2500.00, '2025-01-15', 'Servicios', 'BBVA - *1234', 'Factura mensual de energía eléctrica'),
('Mantenimiento Vehículos', 3200.00, '2025-01-14', 'Mantenimiento', 'Santander - *5678', 'Servicio mayor camión de reparto'),
('Combustible', 1800.00, '2025-01-13', 'Combustible', 'BBVA - *1234', 'Gasolina para vehículos de reparto'),
('Papelería y Oficina', 850.00, '2025-01-12', 'Oficina', 'Banorte - *9012', 'Material de oficina mensual');

-- Insertar movimientos de inventario
INSERT INTO inventory_movements (product_id, product_name, type, quantity, date, reference, user_name) 
SELECT 
  p.id,
  p.name,
  'entrada',
  100,
  '2025-01-15',
  'COMP-001',
  'Admin'
FROM products p WHERE p.code = 'ACE001';

INSERT INTO inventory_movements (product_id, product_name, type, quantity, date, reference, user_name)
SELECT 
  p.id,
  p.name,
  'salida',
  30,
  '2025-01-14',
  'VENTA-002',
  'Empleado García'
FROM products p WHERE p.code = 'ARR001';

INSERT INTO inventory_movements (product_id, product_name, type, quantity, date, reference, user_name)
SELECT 
  p.id,
  p.name,
  'merma',
  5,
  '2025-01-13',
  'MERMA-001',
  'Gerente López'
FROM products p WHERE p.code = 'LEC001';