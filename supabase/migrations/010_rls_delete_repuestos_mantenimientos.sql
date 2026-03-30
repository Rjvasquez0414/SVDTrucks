-- =============================================
-- Migracion: Agregar politicas RLS faltantes para repuestos y mantenimientos
-- Ejecutar en Supabase SQL Editor
-- =============================================

-- 1. Politica de DELETE para repuestos (admins)
-- Necesaria para que la edicion de mantenimientos pueda reemplazar repuestos
CREATE POLICY "Admins pueden eliminar repuestos"
  ON public.repuestos FOR DELETE
  TO authenticated
  USING (is_admin());

-- 2. Politica de UPDATE para repuestos (admins)
CREATE POLICY "Admins pueden actualizar repuestos"
  ON public.repuestos FOR UPDATE
  TO authenticated
  USING (is_admin());

-- 3. Politica de DELETE para mantenimientos (admins)
-- Necesaria para la funcion de eliminar mantenimientos
CREATE POLICY "Admins pueden eliminar mantenimientos"
  ON public.mantenimientos FOR DELETE
  TO authenticated
  USING (is_admin());
