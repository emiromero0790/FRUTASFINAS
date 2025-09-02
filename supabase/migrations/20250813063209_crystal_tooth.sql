/*
  # Add ALMACEN-PRINCIPAL warehouse

  1. New Records
    - Add 'ALMACEN-PRINCIPAL' warehouse to almacenes table
      - `nombre` (text): 'ALMACEN-PRINCIPAL'
      - `ubicacion` (text): 'Ubicación Principal'
      - `activo` (boolean): true
      - `created_at` and `updated_at` (timestamp): current time

  2. Purpose
    - This warehouse is required for the purchase order system
    - All new products from purchases will be stored here by default
    - Resolves the "Almacen Principal not found" error in ListadoCompras
*/

-- Insert ALMACEN-PRINCIPAL if it doesn't exist
INSERT INTO almacenes (nombre, ubicacion, activo)
SELECT 'ALMACEN-PRINCIPAL', 'Ubicación Principal', true
WHERE NOT EXISTS (
  SELECT 1 FROM almacenes WHERE nombre = 'ALMACEN-PRINCIPAL'
);