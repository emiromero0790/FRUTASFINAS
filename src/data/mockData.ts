import { Product, Supplier, Client, Sale, Expense, InventoryMovement } from '../types';

export const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Aceite Comestible 1L',
    code: 'ACE001',
    line: 'Aceites',
    subline: 'Comestibles',
    unit: 'Litro',
    stock: 150,
    cost: 45.50,
    price1: 65.00,
    status: 'active'
  },
  {
    id: '2',
    name: 'Arroz Blanco 1Kg',
    code: 'ARR001',
    line: 'Granos',
    subline: 'Cereales',
    unit: 'Kilogramo',
    stock: 200,
    cost: 22.00,
    price1: 35.00,
    status: 'active'
  },
  {
    id: '3',
    name: 'Leche Entera 1L',
    code: 'LEC001',
    line: 'Lácteos',
    subline: 'Leches',
    unit: 'Litro',
    stock: 80,
    cost: 18.50,
    price1: 28.00,
    status: 'active'
  }
];

export const mockSuppliers: Supplier[] = [
  {
    id: '1',
    name: 'Distribuidora Nacional S.A.',
    rfc: 'DIN123456789',
    address: 'Av. Principal 123, Col. Centro',
    phone: '555-123-4567',
    email: 'ventas@distribuidora.com',
    contact: 'Juan Pérez'
  },
  {
    id: '2',
    name: 'Alimentos del Norte',
    rfc: 'ALN987654321',
    address: 'Boulevard Norte 456, Zona Industrial',
    phone: '555-987-6543',
    email: 'pedidos@alimentosnorte.com',
    contact: 'María González'
  }
];

export const mockClients: Client[] = [
  {
    id: '1',
    name: 'Supermercado El Águila',
    rfc: 'SEA456789123',
    address: 'Calle Comercio 789, Centro',
    phone: '555-456-7890',
    email: 'compras@superaguila.com',
    zone: 'Centro',
    credit_limit: 50000,
    balance: 15000
  },
  {
    id: '2',
    name: 'Tienda La Esquina',
    rfc: 'TLE789123456',
    address: 'Av. Libertad 321, Colonia Norte',
    phone: '555-321-0987',
    email: 'info@laesquina.com',
    zone: 'Norte',
    credit_limit: 25000,
    balance: 8500
  }
];

export const mockSales: Sale[] = [
  {
    id: '1',
    client_id: '1',
    client_name: 'Supermercado El Águila',
    date: '2025-01-15',
    total: 3250.00,
    status: 'paid',
    items: [
      { product_id: '1', product_name: 'Aceite Comestible 1L', quantity: 20, price: 65.00, total: 1300.00 },
      { product_id: '2', product_name: 'Arroz Blanco 1Kg', quantity: 30, price: 35.00, total: 1050.00 },
      { product_id: '3', product_name: 'Leche Entera 1L', quantity: 32, price: 28.00, total: 896.00 }
    ]
  },
  {
    id: '2',
    client_id: '2',
    client_name: 'Tienda La Esquina',
    date: '2025-01-14',
    total: 1580.00,
    status: 'pending',
    items: [
      { product_id: '1', product_name: 'Aceite Comestible 1L', quantity: 10, price: 65.00, total: 650.00 },
      { product_id: '2', product_name: 'Arroz Blanco 1Kg', quantity: 15, price: 35.00, total: 525.00 },
      { product_id: '3', product_name: 'Leche Entera 1L', quantity: 14, price: 28.00, total: 392.00 }
    ]
  }
];

export const mockExpenses: Expense[] = [
  {
    id: '1',
    concept: 'Pago de Luz',
    amount: 2500.00,
    date: '2025-01-15',
    category: 'Servicios',
    bank_account: 'BBVA - *1234',
    description: 'Factura mensual de energía eléctrica'
  },
  {
    id: '2',
    concept: 'Mantenimiento Vehículos',
    amount: 3200.00,
    date: '2025-01-14',
    category: 'Mantenimiento',
    bank_account: 'Santander - *5678',
    description: 'Servicio mayor camión de reparto'
  }
];

export const mockInventoryMovements: InventoryMovement[] = [
  {
    id: '1',
    product_id: '1',
    product_name: 'Aceite Comestible 1L',
    type: 'entrada',
    quantity: 100,
    date: '2025-01-15',
    reference: 'COMP-001',
    user: 'Admin'
  },
  {
    id: '2',
    product_id: '2',
    product_name: 'Arroz Blanco 1Kg',
    type: 'salida',
    quantity: 30,
    date: '2025-01-14',
    reference: 'VENTA-002',
    user: 'Empleado García'
  },
  {
    id: '3',
    product_id: '3',
    product_name: 'Leche Entera 1L',
    type: 'merma',
    quantity: 5,
    date: '2025-01-13',
    reference: 'MERMA-001',
    user: 'Gerente López'
  }
];