export interface User {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Gerente' | 'Empleado';
  avatar?: string;
}

export interface Product {
  id: string;
  name: string;
  code: string;
  line: string;
  subline: string;
  unit: string;
  stock: number; // Now supports decimal values
  cost: number;
  price1?: number;
  price2?: number;
  price3?: number;
  price4?: number;
  price5?: number;
  status: 'active' | 'disabled';
}

export interface Supplier {
  id: string;
  name: string;
  rfc: string;
  address: string;
  phone: string;
  email: string;
  contact: string;
}

export interface Client {
  id: string;
  name: string;
  rfc: string;
  address: string;
  phone: string;
  email: string;
  zone: string;
  credit_limit: number;
  balance: number;
  default_price_level?: 1 | 2 | 3 | 4 | 5;
  default_price_level: 1 | 2 | 3 | 4 | 5;
}

export interface Sale {
  id: string;
  client_id: string;
  client_name: string;
  date: string;
  total: number;
  status: 'pending' | 'paid' | 'overdue' | 'saved';
  items: SaleItem[];
}

export interface SaleItem {
  product_id: string;
  product_name: string;
  quantity: number;
  price: number;
  total: number;
}

export interface Expense {
  id: string;
  concept: string;
  amount: number;
  date: string;
  category: string;
  bank_account: string;
  description: string;
}

export interface InventoryMovement {
  id: string;
  product_id: string;
  product_name: string;
  type: 'entrada' | 'salida' | 'ajuste' | 'merma';
  quantity: number;
  date: string;
  reference: string;
  user: string;
}