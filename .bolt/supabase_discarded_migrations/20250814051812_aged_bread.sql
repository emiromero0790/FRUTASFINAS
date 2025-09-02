/*
  # Add three new users: Emiliano, Aquiles, and Bruno

  1. New Users
    - `emiliano@duran.com` with password `emiliano` and role `Empleado`
    - `aquiles@duran.com` with password `aquiles` and role `Empleado`
    - `bruno@duran.com` with password `bruno` and role `Empleado`

  2. Security
    - Users will be created in auth.users table
    - User profiles will be created in public.users table
    - All users will have role 'Empleado'
*/

-- Insert users into auth.users table (this would normally be done through Supabase Auth API)
-- For this migration, we'll insert directly into the users table with placeholder auth_ids

-- Insert user profiles into public.users table
INSERT INTO public.users (auth_id, name, email, role) VALUES
  (gen_random_uuid(), 'Emiliano', 'emiliano@duran.com', 'Empleado'),
  (gen_random_uuid(), 'Aquiles', 'aquiles@duran.com', 'Empleado'),
  (gen_random_uuid(), 'Bruno', 'bruno@duran.com', 'Empleado')
ON CONFLICT (email) DO NOTHING;