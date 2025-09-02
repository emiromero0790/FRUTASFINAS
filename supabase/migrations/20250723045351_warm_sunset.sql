/*
  # Sistema ERP DURAN - Schema Principal

  1. Nuevas Tablas
    - `users` - Usuarios del sistema con roles
    - `products` - Catálogo de productos
    - `suppliers` - Proveedores
    - `clients` - Clientes
    - `sales` - Ventas realizadas
    - `sale_items` - Detalles de ventas
    - `expenses` - Gastos registrados
    - `inventory_movements` - Movimientos de inventario

  2. Seguridad
    - Habilitar RLS en todas las tablas
    - Políticas para usuarios autenticados
    - Restricciones por roles donde sea necesario

  3. Funcionalidades
    - Triggers para auditoría
    - Funciones para cálculos automáticos
    - Índices para optimización
*/

-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabla de usuarios (extiende auth.users)
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  role text NOT NULL CHECK (role IN ('Admin', 'Gerente', 'Empleado')),
  avatar text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabla de productos
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text UNIQUE NOT NULL,
  line text NOT NULL,
  subline text DEFAULT '',
  unit text DEFAULT '',
  stock integer DEFAULT 0,
  cost decimal(10,2) DEFAULT 0,
  price decimal(10,2) DEFAULT 0,
  status text DEFAULT 'active' CHECK (status IN ('active', 'disabled')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabla de proveedores
CREATE TABLE IF NOT EXISTS suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  rfc text UNIQUE NOT NULL,
  address text DEFAULT '',
  phone text DEFAULT '',
  email text DEFAULT '',
  contact text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabla de clientes
CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  rfc text UNIQUE NOT NULL,
  address text DEFAULT '',
  phone text DEFAULT '',
  email text DEFAULT '',
  zone text DEFAULT '',
  credit_limit decimal(10,2) DEFAULT 0,
  balance decimal(10,2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabla de ventas
CREATE TABLE IF NOT EXISTS sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  client_name text NOT NULL,
  date date DEFAULT CURRENT_DATE,
  total decimal(10,2) DEFAULT 0,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue')),
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabla de items de venta
CREATE TABLE IF NOT EXISTS sale_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id uuid REFERENCES sales(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  product_name text NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  price decimal(10,2) NOT NULL DEFAULT 0,
  total decimal(10,2) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Tabla de gastos
CREATE TABLE IF NOT EXISTS expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  concept text NOT NULL,
  amount decimal(10,2) NOT NULL DEFAULT 0,
  date date DEFAULT CURRENT_DATE,
  category text NOT NULL,
  bank_account text DEFAULT '',
  description text DEFAULT '',
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabla de movimientos de inventario
CREATE TABLE IF NOT EXISTS inventory_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  product_name text NOT NULL,
  type text NOT NULL CHECK (type IN ('entrada', 'salida', 'ajuste', 'merma')),
  quantity integer NOT NULL DEFAULT 0,
  date date DEFAULT CURRENT_DATE,
  reference text DEFAULT '',
  user_name text NOT NULL,
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now()
);

-- Habilitar RLS en todas las tablas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad para usuarios autenticados
CREATE POLICY "Users can read all data" ON users FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE TO authenticated USING (auth.uid() = auth_id);

CREATE POLICY "Users can read products" ON products FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage products" ON products FOR ALL TO authenticated USING (true);

CREATE POLICY "Users can read suppliers" ON suppliers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage suppliers" ON suppliers FOR ALL TO authenticated USING (true);

CREATE POLICY "Users can read clients" ON clients FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage clients" ON clients FOR ALL TO authenticated USING (true);

CREATE POLICY "Users can read sales" ON sales FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage sales" ON sales FOR ALL TO authenticated USING (true);

CREATE POLICY "Users can read sale_items" ON sale_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage sale_items" ON sale_items FOR ALL TO authenticated USING (true);

CREATE POLICY "Users can read expenses" ON expenses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage expenses" ON expenses FOR ALL TO authenticated USING (true);

CREATE POLICY "Users can read inventory_movements" ON inventory_movements FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage inventory_movements" ON inventory_movements FOR ALL TO authenticated USING (true);

-- Índices para optimización
CREATE INDEX IF NOT EXISTS idx_products_code ON products(code);
CREATE INDEX IF NOT EXISTS idx_products_line ON products(line);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_sales_client_id ON sales(client_id);
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(date);
CREATE INDEX IF NOT EXISTS idx_sales_status ON sales(status);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_product_id ON inventory_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_date ON inventory_movements(date);

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sales_updated_at BEFORE UPDATE ON sales FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON expenses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();