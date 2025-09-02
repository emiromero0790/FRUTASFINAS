/*
  # Create Taras, Usuarios, and Sublineas tables

  1. New Tables
    - `taras`
      - `id` (uuid, primary key)
      - `nombre` (text, not null)
      - `peso` (numeric, default 0)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `usuarios_sistema`
      - `id` (uuid, primary key)
      - `auth_id` (uuid, foreign key to auth.users)
      - `almacen` (text)
      - `nombre_completo` (text, not null)
      - `nombre_usuario` (text, unique, not null)
      - `correo` (text, unique, not null)
      - `monto_autorizacion` (numeric, default 0)
      - `puesto` (text, check constraint)
      - `rfc` (text)
      - `curp` (text)
      - `telefono` (text)
      - `estatus` (boolean, default true)
      - `permisos` (jsonb, default '{}')
      - `fecha_registro` (timestamp, default now())
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `sublineas`
      - `id` (uuid, primary key)
      - `clave` (text, unique, not null)
      - `nombre` (text, not null)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
    
  3. Initial Data
    - Insert default taras
    - Insert default sublineas
*/

-- Create taras table
CREATE TABLE IF NOT EXISTS taras (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  peso numeric(10,3) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create usuarios_sistema table
CREATE TABLE IF NOT EXISTS usuarios_sistema (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  almacen text DEFAULT '',
  nombre_completo text NOT NULL,
  nombre_usuario text UNIQUE NOT NULL,
  correo text UNIQUE NOT NULL,
  monto_autorizacion numeric(10,2) DEFAULT 0,
  puesto text NOT NULL CHECK (puesto IN ('Admin', 'Vendedor', 'Chofer')),
  rfc text DEFAULT '',
  curp text DEFAULT '',
  telefono text DEFAULT '',
  estatus boolean DEFAULT true,
  permisos jsonb DEFAULT '{}',
  fecha_registro timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create sublineas table
CREATE TABLE IF NOT EXISTS sublineas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clave text UNIQUE NOT NULL,
  nombre text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE taras ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios_sistema ENABLE ROW LEVEL SECURITY;
ALTER TABLE sublineas ENABLE ROW LEVEL SECURITY;

-- Create policies for taras
CREATE POLICY "Users can manage taras"
  ON taras
  FOR ALL
  TO authenticated
  USING (true);

-- Create policies for usuarios_sistema
CREATE POLICY "Users can read all usuarios"
  ON usuarios_sistema
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage usuarios"
  ON usuarios_sistema
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.auth_id = auth.uid() 
      AND users.role = 'Admin'
    )
  );

-- Create policies for sublineas
CREATE POLICY "Users can manage sublineas"
  ON sublineas
  FOR ALL
  TO authenticated
  USING (true);

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_taras_updated_at
  BEFORE UPDATE ON taras
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_usuarios_sistema_updated_at
  BEFORE UPDATE ON usuarios_sistema
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sublineas_updated_at
  BEFORE UPDATE ON sublineas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default taras
INSERT INTO taras (nombre, peso) VALUES
  ('SIN TARA/VENTA POR PIEZA', 0.0),
  ('MADERA', 2.5),
  ('PLÁSTICO GRANDE', 2.0),
  ('PLÁSTICO CHICO', 1.5),
  ('PLÁSTICO CHICO', 1.6)
ON CONFLICT DO NOTHING;

-- Insert default sublineas
INSERT INTO sublineas (clave, nombre) VALUES
  ('COM', 'Comestibles'),
  ('CER', 'Cereales'),
  ('LEC', 'Leches'),
  ('ENL', 'Enlatados'),
  ('BEB', 'Bebidas'),
  ('DUL', 'Dulces'),
  ('LIM', 'Limpieza'),
  ('HIG', 'Higiene'),
  ('FRU', 'Frutas'),
  ('VER', 'Verduras')
ON CONFLICT DO NOTHING;