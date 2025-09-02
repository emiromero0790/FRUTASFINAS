/*
  # Modify users table and remove usuarios_sistema

  1. Table Modifications
    - Add new columns to `users` table for complete user management
    - Remove `usuarios_sistema` table
    
  2. New Columns Added to users
    - `almacen` (text) - Warehouse assignment
    - `nombre_completo` (text) - Full name (rename from name)
    - `nombre_usuario` (text) - Username
    - `monto_autorizacion` (numeric) - Authorization amount
    - `puesto` (text) - Position (Admin, Vendedor, Chofer)
    - `rfc` (text) - RFC
    - `curp` (text) - CURP
    - `telefono` (text) - Phone
    - `estatus` (boolean) - Status (enabled/disabled)
    - `permisos` (jsonb) - Permissions object
    - `fecha_registro` (timestamp) - Registration date
    
  3. Security
    - Maintain existing RLS policies
    - Update policies for new columns
*/

-- First, add new columns to users table
DO $$
BEGIN
  -- Add almacen column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'almacen'
  ) THEN
    ALTER TABLE users ADD COLUMN almacen text DEFAULT '';
  END IF;

  -- Add nombre_completo column (keep existing name for compatibility)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'nombre_completo'
  ) THEN
    ALTER TABLE users ADD COLUMN nombre_completo text;
  END IF;

  -- Add nombre_usuario column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'nombre_usuario'
  ) THEN
    ALTER TABLE users ADD COLUMN nombre_usuario text;
  END IF;

  -- Add monto_autorizacion column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'monto_autorizacion'
  ) THEN
    ALTER TABLE users ADD COLUMN monto_autorizacion numeric(10,2) DEFAULT 0;
  END IF;

  -- Add puesto column (modify existing role constraint)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'puesto'
  ) THEN
    ALTER TABLE users ADD COLUMN puesto text;
  END IF;

  -- Add rfc column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'rfc'
  ) THEN
    ALTER TABLE users ADD COLUMN rfc text DEFAULT '';
  END IF;

  -- Add curp column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'curp'
  ) THEN
    ALTER TABLE users ADD COLUMN curp text DEFAULT '';
  END IF;

  -- Add telefono column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'telefono'
  ) THEN
    ALTER TABLE users ADD COLUMN telefono text DEFAULT '';
  END IF;

  -- Add estatus column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'estatus'
  ) THEN
    ALTER TABLE users ADD COLUMN estatus boolean DEFAULT true;
  END IF;

  -- Add permisos column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'permisos'
  ) THEN
    ALTER TABLE users ADD COLUMN permisos jsonb DEFAULT '{}';
  END IF;

  -- Add fecha_registro column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'fecha_registro'
  ) THEN
    ALTER TABLE users ADD COLUMN fecha_registro timestamptz DEFAULT now();
  END IF;
END $$;

-- Update existing users to have the new structure
UPDATE users 
SET 
  nombre_completo = COALESCE(nombre_completo, name),
  nombre_usuario = COALESCE(nombre_usuario, LOWER(REPLACE(name, ' ', ''))),
  puesto = COALESCE(puesto, role),
  estatus = COALESCE(estatus, true),
  fecha_registro = COALESCE(fecha_registro, created_at)
WHERE nombre_completo IS NULL OR nombre_usuario IS NULL OR puesto IS NULL;

-- Update role constraint to include new puesto values
DO $$
BEGIN
  -- Drop existing constraint if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'users' AND constraint_name = 'users_role_check'
  ) THEN
    ALTER TABLE users DROP CONSTRAINT users_role_check;
  END IF;

  -- Add new constraint for role
  ALTER TABLE users ADD CONSTRAINT users_role_check 
    CHECK (role = ANY (ARRAY['Admin'::text, 'Gerente'::text, 'Empleado'::text]));

  -- Add constraint for puesto
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'users' AND constraint_name = 'users_puesto_check'
  ) THEN
    ALTER TABLE users ADD CONSTRAINT users_puesto_check 
      CHECK (puesto = ANY (ARRAY['Admin'::text, 'Vendedor'::text, 'Chofer'::text]));
  END IF;
END $$;

-- Drop usuarios_sistema table if it exists
DROP TABLE IF EXISTS usuarios_sistema CASCADE;

-- Update RLS policies for users table to handle new columns
DROP POLICY IF EXISTS "Users can update own profile" ON users;

CREATE POLICY "Users can update own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (uid() = auth_id)
  WITH CHECK (uid() = auth_id);

-- Add policy for admins to manage all users
DROP POLICY IF EXISTS "Admins can manage all users" ON users;

CREATE POLICY "Admins can manage all users"
  ON users
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE auth_id = uid() AND role = 'Admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE auth_id = uid() AND role = 'Admin'
    )
  );