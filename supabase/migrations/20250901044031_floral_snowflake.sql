/*
  # Agregar folio y validación a order_warehouse_distribution

  1. Cambios en la Tabla
    - Agregar columna `folio` a `order_warehouse_distribution`
    - El folio debe coincidir con el folio del pedido
    - Crear función de validación para verificar coincidencia de folios

  2. Validación
    - Función que verifica que el folio del producto coincida con el folio del pedido
    - Trigger que ejecuta la validación antes de INSERT
    - Previene inconsistencias en la distribución de almacenes

  3. Seguridad
    - Mantener políticas RLS existentes
    - Agregar validación a nivel de base de datos
*/

-- Agregar columna folio a order_warehouse_distribution
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'order_warehouse_distribution' AND column_name = 'folio'
  ) THEN
    ALTER TABLE order_warehouse_distribution ADD COLUMN folio text NOT NULL DEFAULT '';
  END IF;
END $$;

-- Crear función de validación para verificar coincidencia de folios
CREATE OR REPLACE FUNCTION validate_folio_consistency()
RETURNS TRIGGER AS $$
DECLARE
  order_folio text;
BEGIN
  -- Obtener el folio del pedido desde la tabla sales
  SELECT id::text INTO order_folio
  FROM sales 
  WHERE id::text = NEW.order_id;
  
  -- Si no se encuentra el pedido, permitir (puede ser un pedido temporal)
  IF order_folio IS NULL THEN
    -- Para pedidos temporales, usar el order_id como folio
    NEW.folio = NEW.order_id;
    RETURN NEW;
  END IF;
  
  -- Verificar que el folio proporcionado coincida con el folio del pedido
  IF NEW.folio != order_folio AND NEW.folio != NEW.order_id THEN
    RAISE EXCEPTION 'El folio del producto (%) no coincide con el folio del pedido (%)', 
      NEW.folio, order_folio;
  END IF;
  
  -- Si no se proporcionó folio, usar el del pedido
  IF NEW.folio = '' OR NEW.folio IS NULL THEN
    NEW.folio = order_folio;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para validar folios antes de INSERT
DROP TRIGGER IF EXISTS validate_folio_before_insert ON order_warehouse_distribution;
CREATE TRIGGER validate_folio_before_insert
  BEFORE INSERT ON order_warehouse_distribution
  FOR EACH ROW
  EXECUTE FUNCTION validate_folio_consistency();

-- Actualizar registros existentes para que tengan el folio correcto
UPDATE order_warehouse_distribution 
SET folio = order_id 
WHERE folio = '' OR folio IS NULL;

-- Crear índice para mejorar performance en consultas por folio
CREATE INDEX IF NOT EXISTS idx_order_warehouse_distribution_folio 
  ON order_warehouse_distribution(folio);

-- Agregar comentario para documentar el propósito de la columna
COMMENT ON COLUMN order_warehouse_distribution.folio IS 'Folio del pedido que debe coincidir con el order_id para mantener consistencia';

-- Crear función auxiliar para obtener distribuciones por folio
CREATE OR REPLACE FUNCTION get_warehouse_distribution_by_folio(pedido_folio text)
RETURNS TABLE (
  product_id uuid,
  warehouse_id uuid,
  warehouse_name text,
  quantity numeric,
  folio text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    owd.product_id,
    owd.warehouse_id,
    owd.warehouse_name,
    owd.quantity,
    owd.folio
  FROM order_warehouse_distribution owd
  WHERE owd.folio = pedido_folio
  ORDER BY owd.created_at;
END;
$$ LANGUAGE plpgsql;

-- Crear función para validar distribución completa de un pedido
CREATE OR REPLACE FUNCTION validate_order_distribution(pedido_folio text)
RETURNS TABLE (
  is_valid boolean,
  missing_products text[],
  excess_products text[]
) AS $$
DECLARE
  order_products RECORD;
  distribution_products RECORD;
  missing_list text[] := '{}';
  excess_list text[] := '{}';
  is_distribution_valid boolean := true;
BEGIN
  -- Verificar que todos los productos del pedido tengan distribución
  FOR order_products IN 
    SELECT si.product_id, si.product_name, si.quantity
    FROM sales s
    JOIN sale_items si ON s.id = si.sale_id
    WHERE s.id::text = pedido_folio
  LOOP
    -- Verificar si existe distribución para este producto
    SELECT SUM(quantity) as total_distributed
    INTO distribution_products
    FROM order_warehouse_distribution
    WHERE folio = pedido_folio AND product_id = order_products.product_id;
    
    -- Si no hay distribución o la cantidad no coincide
    IF distribution_products.total_distributed IS NULL THEN
      missing_list := array_append(missing_list, order_products.product_name);
      is_distribution_valid := false;
    ELSIF distribution_products.total_distributed != order_products.quantity THEN
      excess_list := array_append(excess_list, 
        order_products.product_name || ' (esperado: ' || order_products.quantity || 
        ', distribuido: ' || distribution_products.total_distributed || ')');
      is_distribution_valid := false;
    END IF;
  END LOOP;
  
  RETURN QUERY SELECT is_distribution_valid, missing_list, excess_list;
END;
$$ LANGUAGE plpgsql;