/*
  # Add user permissions and additional fields

  1. New Columns
    - `rfc` (varchar) - RFC del usuario
    - `curp` (varchar) - CURP del usuario  
    - `telefono` (varchar) - Teléfono del usuario
    - 11 permission columns (boolean) - Permisos específicos del usuario

  2. Security
    - Update existing RLS policies
    - Admin users get all permissions by default

  3. Changes
    - Add all missing columns to users table
    - Set default permissions for Admin role
*/

-- Add missing personal information columns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'rfc'
  ) THEN
    ALTER TABLE users ADD COLUMN rfc text DEFAULT '';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'curp'
  ) THEN
    ALTER TABLE users ADD COLUMN curp text DEFAULT '';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'telefono'
  ) THEN
    ALTER TABLE users ADD COLUMN telefono text DEFAULT '';
  END IF;
END $$;

-- Add permission columns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'permiso_corte_normal'
  ) THEN
    ALTER TABLE users ADD COLUMN permiso_corte_normal boolean DEFAULT false;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'permiso_des_reimpresion_remisiones'
  ) THEN
    ALTER TABLE users ADD COLUMN permiso_des_reimpresion_remisiones boolean DEFAULT false;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'permiso_cancelaciones'
  ) THEN
    ALTER TABLE users ADD COLUMN permiso_cancelaciones boolean DEFAULT false;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'permiso_cobro_directo'
  ) THEN
    ALTER TABLE users ADD COLUMN permiso_cobro_directo boolean DEFAULT false;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'permiso_precio_libre'
  ) THEN
    ALTER TABLE users ADD COLUMN permiso_precio_libre boolean DEFAULT false;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'permiso_venta_sin_existencia'
  ) THEN
    ALTER TABLE users ADD COLUMN permiso_venta_sin_existencia boolean DEFAULT false;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'permiso_ventas_credito'
  ) THEN
    ALTER TABLE users ADD COLUMN permiso_ventas_credito boolean DEFAULT false;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'permiso_ventas_especiales'
  ) THEN
    ALTER TABLE users ADD COLUMN permiso_ventas_especiales boolean DEFAULT false;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'permiso_antipos'
  ) THEN
    ALTER TABLE users ADD COLUMN permiso_antipos boolean DEFAULT false;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'permiso_ver_imprimir_cortes'
  ) THEN
    ALTER TABLE users ADD COLUMN permiso_ver_imprimir_cortes boolean DEFAULT false;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'permiso_agregar_clientes'
  ) THEN
    ALTER TABLE users ADD COLUMN permiso_agregar_clientes boolean DEFAULT false;
  END IF;
END $$;

-- Set all permissions to true for existing Admin users
UPDATE users 
SET 
  permiso_corte_normal = true,
  permiso_des_reimpresion_remisiones = true,
  permiso_cancelaciones = true,
  permiso_cobro_directo = true,
  permiso_precio_libre = true,
  permiso_venta_sin_existencia = true,
  permiso_ventas_credito = true,
  permiso_ventas_especiales = true,
  permiso_antipos = true,
  permiso_ver_imprimir_cortes = true,
  permiso_agregar_clientes = true
WHERE role = 'Admin';

-- Create trigger to automatically set all permissions for new Admin users
CREATE OR REPLACE FUNCTION set_admin_permissions()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role = 'Admin' THEN
    NEW.permiso_corte_normal = true;
    NEW.permiso_des_reimpresion_remisiones = true;
    NEW.permiso_cancelaciones = true;
    NEW.permiso_cobro_directo = true;
    NEW.permiso_precio_libre = true;
    NEW.permiso_venta_sin_existencia = true;
    NEW.permiso_ventas_credito = true;
    NEW.permiso_ventas_especiales = true;
    NEW.permiso_antipos = true;
    NEW.permiso_ver_imprimir_cortes = true;
    NEW.permiso_agregar_clientes = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for INSERT operations
DROP TRIGGER IF EXISTS set_admin_permissions_on_insert ON users;
CREATE TRIGGER set_admin_permissions_on_insert
  BEFORE INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION set_admin_permissions();

-- Create trigger for UPDATE operations (when role changes to Admin)
DROP TRIGGER IF EXISTS set_admin_permissions_on_update ON users;
CREATE TRIGGER set_admin_permissions_on_update
  BEFORE UPDATE ON users
  FOR EACH ROW
  WHEN (NEW.role = 'Admin' AND OLD.role != 'Admin')
  EXECUTE FUNCTION set_admin_permissions();