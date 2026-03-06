-- =============================================
-- EAM DIONE - Limpiar datos de prueba
-- Dejar el sistema limpio para uso en produccion
-- =============================================

-- Primero eliminar repuestos (dependen de mantenimientos)
DELETE FROM public.repuestos;

-- Eliminar mantenimientos
DELETE FROM public.mantenimientos;

-- Eliminar alertas
DELETE FROM public.alertas;

-- Eliminar documentos
DELETE FROM public.documentos;
