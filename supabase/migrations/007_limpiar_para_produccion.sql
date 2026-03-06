-- =============================================
-- EAM DIONE - Limpieza de datos de prueba para produccion
-- =============================================
-- Esta migracion elimina TODOS los datos transaccionales/de prueba
-- y conserva los datos base de la flota y los catalogos de referencia.
--
-- CONSERVA:
--   - vehiculos (7 camiones reales)
--   - conductores (6 conductores reales)
--   - remolques (6 remolques reales)
--   - catalogo_mantenimiento (tipos de mantenimiento)
--   - catalogo_documentos (tipos de documentos)
--   - usuarios (cuentas de acceso)
--
-- ELIMINA:
--   - repuestos (de mantenimientos de prueba)
--   - mantenimientos (registros de prueba)
--   - alertas (generadas durante pruebas)
--   - documentos (cargados durante pruebas)
--
-- NOTA: Los archivos en Supabase Storage (buckets 'documentos' y
-- 'mantenimiento-imagenes') deben limpiarse manualmente desde el
-- dashboard de Supabase > Storage, ya que no se pueden eliminar via SQL.
-- =============================================

-- 1. Eliminar repuestos (dependen de mantenimientos)
DELETE FROM public.repuestos;

-- 2. Eliminar mantenimientos
DELETE FROM public.mantenimientos;

-- 3. Eliminar alertas
DELETE FROM public.alertas;

-- 4. Eliminar documentos
DELETE FROM public.documentos;

-- 5. Resetear kilometraje_updated_at para que arranque limpio
UPDATE public.vehiculos
SET kilometraje_updated_at = NOW();
