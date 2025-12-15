-- =============================================
-- Migracion: Corregir ENUM tipo_alerta y RLS para alertas
-- Ejecutar en Supabase SQL Editor
-- =============================================

-- 1. Agregar nuevos valores al ENUM tipo_alerta
-- Nota: PostgreSQL no permite ADD VALUE en transaccion, ejecutar cada uno por separado

ALTER TYPE tipo_alerta ADD VALUE IF NOT EXISTS 'vencimiento_documento';
ALTER TYPE tipo_alerta ADD VALUE IF NOT EXISTS 'documento_vencido';
ALTER TYPE tipo_alerta ADD VALUE IF NOT EXISTS 'mantenimiento_pendiente';
ALTER TYPE tipo_alerta ADD VALUE IF NOT EXISTS 'actualizar_kilometraje';
ALTER TYPE tipo_alerta ADD VALUE IF NOT EXISTS 'kilometraje_alto';

-- 2. Agregar politica de INSERT para alertas (usuarios autenticados pueden insertar)
CREATE POLICY "Usuarios autenticados pueden insertar alertas"
  ON public.alertas FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 3. Agregar politica de DELETE para admins (para limpiar alertas huerfanas)
CREATE POLICY "Admins pueden eliminar alertas"
  ON public.alertas FOR DELETE
  TO authenticated
  USING (is_admin());

-- Verificar que las politicas se crearon correctamente
-- SELECT * FROM pg_policies WHERE tablename = 'alertas';
