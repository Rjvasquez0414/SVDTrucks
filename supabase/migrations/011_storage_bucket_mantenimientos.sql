-- =============================================
-- Migracion: Crear bucket de storage para mantenimientos
-- Ejecutar en Supabase SQL Editor
-- =============================================

-- Crear bucket publico para evidencia de mantenimientos
INSERT INTO storage.buckets (id, name, public)
VALUES ('mantenimientos', 'mantenimientos', true)
ON CONFLICT (id) DO NOTHING;

-- Permitir a usuarios autenticados subir archivos
CREATE POLICY "Usuarios autenticados pueden subir archivos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'mantenimientos');

-- Permitir a todos ver archivos (bucket publico)
CREATE POLICY "Archivos de mantenimientos son publicos"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'mantenimientos');

-- Permitir a admins eliminar archivos de mantenimientos
CREATE POLICY "Admins pueden eliminar archivos de mantenimientos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'mantenimientos');
