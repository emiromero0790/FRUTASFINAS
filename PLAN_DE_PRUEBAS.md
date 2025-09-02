# Plan de Pruebas Exhaustivo - Sistema ERP DURAN

## 1. Proveedores - Eliminación de Acciones Rápidas

### Casos de Prueba:
- **TC-PROV-001**: Verificar que la sección "Acciones Rápidas" no aparece en la página de proveedores
- **TC-PROV-002**: Confirmar que solo aparece "Estadísticas de Proveedores"
- **TC-PROV-003**: Validar que todas las funciones básicas de proveedores siguen funcionando

### Criterios de Aceptación:
- ✅ No debe existir la sección "Acciones Rápidas"
- ✅ La funcionalidad de CRUD de proveedores debe mantenerse intacta
- ✅ Las estadísticas deben mostrarse correctamente

---

## 2. Catálogos - Gestión de Precios de Productos

### Casos de Prueba:
- **TC-CAT-001**: Verificar que aparece la nueva pestaña "Precios de Productos"
- **TC-CAT-002**: Probar la funcionalidad de actualización de precios (5 niveles)
- **TC-CAT-003**: Validar que los precios se guardan correctamente en la base de datos
- **TC-CAT-004**: Confirmar que los precios actualizados se reflejan en el POS

### Criterios de Aceptación:
- ✅ Nueva pestaña "Precios de Productos" visible
- ✅ Modal de actualización de precios funcional
- ✅ Los 5 niveles de precio se pueden editar
- ✅ Cambios se persisten en la base de datos
- ✅ Validación de datos de entrada

### Datos de Prueba:
```
Producto: Aceite Comestible 1L
Precio 1: $65.00 (General)
Precio 2: $68.00 (Mayoreo)
Precio 3: $70.00 (Distribuidor)
Precio 4: $72.00 (VIP)
Precio 5: $75.00 (Especial)
```

---

## 3. CFDI - Actualización de Documentos

### Casos de Prueba:
- **TC-CFDI-001**: Verificar que aparece el botón "Actualizar" en cada CFDI
- **TC-CFDI-002**: Probar la selección de producto dentro del CFDI
- **TC-CFDI-003**: Validar la actualización de precio de un producto específico
- **TC-CFDI-004**: Confirmar que el total del CFDI se recalcula automáticamente
- **TC-CFDI-005**: Verificar que solo se pueden actualizar CFDIs en estado "borrador"

### Criterios de Aceptación:
- ✅ Botón "Actualizar" visible en cada CFDI
- ✅ Modal de actualización funcional
- ✅ Lista de productos del CFDI cargada correctamente
- ✅ Precio se actualiza y total se recalcula
- ✅ Cambios se persisten en la base de datos

### Datos de Prueba:
```
CFDI: A-001
Producto: Aceite Comestible 1L
Precio Original: $65.00
Precio Nuevo: $70.00
Cantidad: 20
Nuevo Total Item: $1,400.00
```

---

## 4. Precios de Venta - Corrección de Búsqueda

### Casos de Prueba:
- **TC-PRECIO-001**: Probar búsqueda por nombre de cliente
- **TC-PRECIO-002**: Probar búsqueda por nombre de producto
- **TC-PRECIO-003**: Verificar filtros combinados
- **TC-PRECIO-004**: Confirmar que se eliminó la funcionalidad de "precios especiales"

### Criterios de Aceptación:
- ✅ Búsqueda por cliente funciona correctamente
- ✅ Búsqueda por producto funciona correctamente
- ✅ Filtros se aplican correctamente
- ✅ No existe funcionalidad de precios especiales

---

## 5. Autocompletado - Campos de Búsqueda

### Casos de Prueba:
- **TC-AUTO-001**: Verificar autocompletado en búsqueda de productos
- **TC-AUTO-002**: Probar navegación con teclado (↑↓, Enter, Escape)
- **TC-AUTO-003**: Validar filtrado en tiempo real
- **TC-AUTO-004**: Confirmar selección de elementos

### Criterios de Aceptación:
- ✅ Componente AutocompleteInput implementado
- ✅ Navegación con teclado funcional
- ✅ Filtrado en tiempo real
- ✅ Selección correcta de elementos
- ✅ Integrado en formularios relevantes

### Datos de Prueba:
```
Búsqueda: "ace" → Debe mostrar "Aceite Comestible 1L"
Búsqueda: "ARR001" → Debe mostrar "Arroz Blanco 1Kg"
```

---

## 6. Traspasos de Almacén - Conectado a Base de Datos

### Casos de Prueba:
- **TC-TRAS-001**: Verificar creación de almacenes por defecto
- **TC-TRAS-002**: Probar creación de traspaso entre almacenes
- **TC-TRAS-003**: Validar actualización de stock por almacén
- **TC-TRAS-004**: Confirmar cambios de estado de traspaso
- **TC-TRAS-005**: Verificar restricciones de stock

### Criterios de Aceptación:
- ✅ Tabla `warehouses` creada con almacenes por defecto
- ✅ Tabla `warehouse_stock` para stock por almacén
- ✅ Tabla `warehouse_transfers` para traspasos
- ✅ Stock se actualiza correctamente al completar traspaso
- ✅ Validación de stock disponible antes de crear traspaso

### Datos de Prueba:
```
Almacén Origen: BODEGA-PRINCIPAL
Almacén Destino: SUCURSAL-CENTRO
Producto: Aceite Comestible 1L
Cantidad: 50
Stock Origen Antes: 150
Stock Origen Después: 100
Stock Destino Antes: 20
Stock Destino Después: 70
```

---

## 7. Clientes - Corrección de Guardado

### Casos de Prueba:
- **TC-CLI-001**: Crear nuevo cliente con datos válidos
- **TC-CLI-002**: Validar campos requeridos (nombre, RFC)
- **TC-CLI-003**: Probar actualización de cliente existente
- **TC-CLI-004**: Verificar manejo de errores de base de datos
- **TC-CLI-005**: Confirmar que el cliente aparece en la lista después de crearlo

### Criterios de Aceptación:
- ✅ Nuevos clientes se guardan correctamente
- ✅ Validación de campos requeridos
- ✅ Mensajes de error informativos
- ✅ Logging mejorado para debugging
- ✅ Cliente aparece inmediatamente en la lista

### Datos de Prueba:
```
Cliente Válido:
- Nombre: "Supermercado Nuevo"
- RFC: "SUP123456789"
- Dirección: "Av. Principal 123"
- Teléfono: "555-123-4567"
- Email: "contacto@supernuevo.com"
- Zona: "Centro"
- Límite Crédito: $50,000
- Saldo: $0

Cliente Inválido:
- Nombre: "" (vacío)
- RFC: "" (vacío)
```

---

## 8. Precios Especiales - Eliminación

### Casos de Prueba:
- **TC-PESP-001**: Verificar que no existe funcionalidad de precios especiales
- **TC-PESP-002**: Confirmar que la página muestra información de precios regulares
- **TC-PESP-003**: Validar que no hay referencias a precios especiales en el código

### Criterios de Aceptación:
- ✅ No existe funcionalidad de precios especiales
- ✅ Página muestra precios regulares de productos
- ✅ Interfaz limpia sin referencias a precios especiales

---

## 9. Reporte de Cajas - Conectado a Base de Datos

### Casos de Prueba:
- **TC-REP-001**: Verificar que el reporte muestra datos reales de cajas
- **TC-REP-002**: Probar filtros por caja, usuario y fecha
- **TC-REP-003**: Validar detalle de ventas por caja
- **TC-REP-004**: Confirmar exportación de reportes
- **TC-REP-005**: Probar modal de detalle de caja

### Criterios de Aceptación:
- ✅ Reporte conectado a tabla `cash_registers`
- ✅ Filtros funcionan correctamente
- ✅ Detalle de ventas por caja visible
- ✅ Exportación de reportes funcional
- ✅ Modal de detalle completo y funcional

### Datos de Prueba:
```
Caja: CAJA-01
Usuario: Juan Pérez
Fecha: 2025-01-15
Apertura: $5,000.00
Ventas Efectivo: $15,000.00
Ventas Tarjeta: $8,500.00
Ventas Transferencia: $3,200.00
Total Ventas: $26,700.00
Cierre: $18,500.00
Diferencia: -$200.00
```

---

## 10. Pruebas de Integración

### Casos de Prueba de Integración:
- **TC-INT-001**: Verificar que los cambios de precios en Catálogos se reflejan en POS
- **TC-INT-002**: Confirmar que los traspasos actualizan el stock correctamente
- **TC-INT-003**: Validar que las actualizaciones de CFDI afectan los totales
- **TC-INT-004**: Probar que los reportes de caja muestran datos consistentes

### Criterios de Aceptación:
- ✅ Consistencia de datos entre módulos
- ✅ Actualizaciones en tiempo real
- ✅ Integridad referencial mantenida
- ✅ Performance aceptable

---

## 11. Pruebas de Usabilidad

### Casos de Prueba UX:
- **TC-UX-001**: Verificar que el autocompletado mejora la experiencia de usuario
- **TC-UX-002**: Confirmar que los formularios son intuitivos
- **TC-UX-003**: Validar que los mensajes de error son claros
- **TC-UX-004**: Probar responsividad en diferentes dispositivos

### Criterios de Aceptación:
- ✅ Autocompletado funciona fluidamente
- ✅ Formularios son fáciles de usar
- ✅ Mensajes de error informativos
- ✅ Interfaz responsive

---

## 12. Pruebas de Performance

### Casos de Prueba de Performance:
- **TC-PERF-001**: Medir tiempo de carga de listas grandes de productos
- **TC-PERF-002**: Verificar performance del autocompletado con muchos elementos
- **TC-PERF-003**: Probar tiempo de respuesta de actualizaciones de CFDI
- **TC-PERF-004**: Validar performance de reportes con grandes volúmenes de datos

### Criterios de Aceptación:
- ✅ Tiempo de carga < 3 segundos
- ✅ Autocompletado responde < 500ms
- ✅ Actualizaciones < 2 segundos
- ✅ Reportes cargan < 5 segundos

---

## 13. Pruebas de Seguridad

### Casos de Prueba de Seguridad:
- **TC-SEC-001**: Verificar que solo usuarios autenticados pueden acceder
- **TC-SEC-002**: Confirmar que las políticas RLS funcionan correctamente
- **TC-SEC-003**: Validar que no se pueden hacer traspasos sin autorización
- **TC-SEC-004**: Probar que las actualizaciones de precios requieren permisos

### Criterios de Aceptación:
- ✅ Autenticación requerida para todas las operaciones
- ✅ RLS policies aplicadas correctamente
- ✅ Autorización apropiada para operaciones sensibles
- ✅ Logs de auditoría para cambios importantes

---

## 14. Pruebas de Regresión

### Casos de Prueba de Regresión:
- **TC-REG-001**: Verificar que el POS sigue funcionando correctamente
- **TC-REG-002**: Confirmar que las ventas se procesan normalmente
- **TC-REG-003**: Validar que los reportes existentes no se afectaron
- **TC-REG-004**: Probar que la autenticación sigue funcionando

### Criterios de Aceptación:
- ✅ Funcionalidad existente no afectada
- ✅ POS opera normalmente
- ✅ Reportes existentes funcionan
- ✅ Sistema de autenticación intacto

---

## 15. Checklist de Validación Final

### Antes de Producción:
- [ ] Todos los casos de prueba ejecutados exitosamente
- [ ] Base de datos migrada correctamente
- [ ] Backup de datos realizado
- [ ] Performance validada
- [ ] Seguridad verificada
- [ ] Documentación actualizada
- [ ] Capacitación de usuarios completada

### Criterios de Rollback:
- Si más del 20% de las pruebas fallan
- Si hay pérdida de datos
- Si el performance se degrada significativamente
- Si hay problemas de seguridad críticos

---

## 16. Ambiente de Pruebas

### Configuración Requerida:
- Base de datos de prueba con datos de muestra
- Usuarios de prueba con diferentes roles
- Productos de prueba en diferentes categorías
- Clientes de prueba con diferentes configuraciones

### Datos de Muestra:
```sql
-- Productos de prueba
INSERT INTO products (name, code, line, price, stock) VALUES
('Aceite Comestible 1L', 'ACE001', 'Aceites', 65.00, 150),
('Arroz Blanco 1Kg', 'ARR001', 'Granos', 35.00, 200),
('Leche Entera 1L', 'LEC001', 'Lácteos', 28.00, 80);

-- Clientes de prueba
INSERT INTO clients (name, rfc, credit_limit, balance) VALUES
('Supermercado El Águila', 'SEA456789123', 50000, 15000),
('Tienda La Esquina', 'TLE789123456', 25000, 8500);

-- Almacenes de prueba (ya incluidos en migración)
```

---

## 17. Métricas de Éxito

### KPIs a Monitorear:
- **Tiempo de respuesta**: < 3 segundos para operaciones críticas
- **Disponibilidad**: > 99.5% uptime
- **Errores**: < 1% de transacciones con error
- **Satisfacción del usuario**: > 4.5/5 en encuestas
- **Adopción**: > 80% de usuarios utilizando nuevas funciones en 30 días

### Reportes de Monitoreo:
- Reporte diario de performance
- Reporte semanal de errores
- Reporte mensual de adopción de funciones
- Feedback continuo de usuarios

---

## 18. Plan de Contingencia

### Escenarios de Falla:
1. **Falla de Base de Datos**: Procedimiento de restauración desde backup
2. **Falla de Aplicación**: Rollback a versión anterior
3. **Falla de Red**: Modo offline temporal (si aplicable)
4. **Falla de Autenticación**: Procedimiento de recuperación de acceso

### Contactos de Emergencia:
- Administrador de Sistema: [contacto]
- Desarrollador Principal: [contacto]
- Administrador de Base de Datos: [contacto]

---

Este plan de pruebas debe ejecutarse completamente antes de cualquier despliegue a producción. Cada caso de prueba debe documentarse con resultados específicos y cualquier issue encontrado debe resolverse antes de continuar.