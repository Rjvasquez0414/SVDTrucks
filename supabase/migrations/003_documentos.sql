-- =============================================
-- SVD Trucks - Migracion: Sistema de Documentacion
-- =============================================

-- Tipo ENUM para categorias de documentos
CREATE TYPE categoria_documento AS ENUM (
  'cabezote',
  'tanque',
  'conductor',
  'polizas'
);

-- Tipo ENUM para tipos de documentos
CREATE TYPE tipo_documento AS ENUM (
  -- Cabezote
  'soat',
  'poliza_rc_hidrocarburos',
  'revision_tecnomecanica',
  -- Tanque
  'prueba_hidrostatica',
  'certificado_luz_negra',
  'programa_mantenimiento_copetran',
  'certificacion_quinta_rueda',
  -- Conductor
  'eps',
  'arl',
  'curso_mercancias_peligrosas',
  'curso_hse_ecopetrol',
  'licencia_conduccion',
  'curso_manejo_defensivo',
  'curso_trabajo_alturas',
  -- Polizas
  'poliza_todo_riesgo_cabezote',
  'poliza_todo_riesgo_tanque',
  'poliza_decreto_1079',
  'poliza_rce_copetran',
  'poliza_rce_exceso_copetran'
);

-- =============================================
-- TABLA: documentos
-- =============================================

CREATE TABLE public.documentos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Tipo y categoria del documento
  tipo tipo_documento NOT NULL,
  categoria categoria_documento NOT NULL,
  nombre TEXT NOT NULL,

  -- Entidad a la que pertenece (solo una debe estar llena)
  vehiculo_id UUID REFERENCES public.vehiculos(id) ON DELETE CASCADE,
  remolque_id UUID REFERENCES public.remolques(id) ON DELETE CASCADE,
  conductor_id UUID REFERENCES public.conductores(id) ON DELETE CASCADE,

  -- Fechas
  fecha_emision DATE,
  fecha_vencimiento DATE,

  -- Archivo
  archivo_url TEXT,
  archivo_nombre TEXT,

  -- Metadata
  numero_documento TEXT,
  entidad_emisora TEXT,
  notas TEXT,

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraint: al menos una entidad debe estar asignada
  CONSTRAINT documento_entidad_check CHECK (
    (vehiculo_id IS NOT NULL)::int +
    (remolque_id IS NOT NULL)::int +
    (conductor_id IS NOT NULL)::int >= 1
  )
);

-- Indices para mejor rendimiento
CREATE INDEX idx_documentos_vehiculo ON public.documentos(vehiculo_id);
CREATE INDEX idx_documentos_remolque ON public.documentos(remolque_id);
CREATE INDEX idx_documentos_conductor ON public.documentos(conductor_id);
CREATE INDEX idx_documentos_categoria ON public.documentos(categoria);
CREATE INDEX idx_documentos_tipo ON public.documentos(tipo);
CREATE INDEX idx_documentos_vencimiento ON public.documentos(fecha_vencimiento);

-- Trigger para updated_at
CREATE TRIGGER update_documentos_updated_at
  BEFORE UPDATE ON public.documentos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE public.documentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios autenticados pueden ver documentos"
  ON public.documentos FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins pueden insertar documentos"
  ON public.documentos FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Admins pueden actualizar documentos"
  ON public.documentos FOR UPDATE
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins pueden eliminar documentos"
  ON public.documentos FOR DELETE
  TO authenticated
  USING (is_admin());

-- =============================================
-- TABLA: catalogo_documentos (para referencia)
-- =============================================

CREATE TABLE public.catalogo_documentos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tipo tipo_documento NOT NULL UNIQUE,
  categoria categoria_documento NOT NULL,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  requiere_vencimiento BOOLEAN NOT NULL DEFAULT true,
  aplica_a TEXT[] NOT NULL, -- ['vehiculo', 'remolque', 'conductor']
  es_copetran BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS para catalogo
ALTER TABLE public.catalogo_documentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos pueden ver catalogo documentos"
  ON public.catalogo_documentos FOR SELECT
  TO authenticated
  USING (true);

-- =============================================
-- DATOS INICIALES: Catalogo de documentos
-- =============================================

INSERT INTO public.catalogo_documentos (tipo, categoria, nombre, descripcion, requiere_vencimiento, aplica_a, es_copetran) VALUES
  -- Cabezote
  ('soat', 'cabezote', 'SOAT', 'Seguro Obligatorio de Accidentes de Transito', true, ARRAY['vehiculo'], false),
  ('poliza_rc_hidrocarburos', 'cabezote', 'Poliza RC Hidrocarburos', 'Poliza de Responsabilidad Civil para transporte de hidrocarburos', true, ARRAY['vehiculo', 'remolque'], false),
  ('revision_tecnomecanica', 'cabezote', 'Revision Tecnomecanica', 'Certificado de revision tecnico-mecanica y de emisiones', true, ARRAY['vehiculo'], false),

  -- Tanque
  ('prueba_hidrostatica', 'tanque', 'Prueba Hidrostatica', 'Certificado de prueba hidrostatica del tanque', true, ARRAY['remolque'], false),
  ('certificado_luz_negra', 'tanque', 'Certificado Luz Negra', 'Certificado de inspeccion con luz negra', true, ARRAY['remolque'], true),
  ('programa_mantenimiento_copetran', 'tanque', 'Programa de Mantenimiento', 'Programa de mantenimiento certificado por Copetran', true, ARRAY['remolque'], true),
  ('certificacion_quinta_rueda', 'tanque', 'Certificacion Quinta Rueda', 'Certificacion del sistema de quinta rueda', true, ARRAY['remolque'], true),

  -- Conductor
  ('eps', 'conductor', 'EPS', 'Afiliacion a Entidad Promotora de Salud', true, ARRAY['conductor'], false),
  ('arl', 'conductor', 'ARL', 'Afiliacion a Administradora de Riesgos Laborales', true, ARRAY['conductor'], false),
  ('curso_mercancias_peligrosas', 'conductor', 'Curso Mercancias Peligrosas', 'Certificacion en manejo de mercancias peligrosas', true, ARRAY['conductor'], false),
  ('curso_hse_ecopetrol', 'conductor', 'Curso HSE Ecopetrol', 'Certificacion HSE requerida por Ecopetrol', true, ARRAY['conductor'], false),
  ('licencia_conduccion', 'conductor', 'Licencia de Conduccion', 'Licencia de conduccion categoria C2 o superior', true, ARRAY['conductor'], false),
  ('curso_manejo_defensivo', 'conductor', 'Curso Manejo Defensivo', 'Certificacion en tecnicas de manejo defensivo', true, ARRAY['conductor'], false),
  ('curso_trabajo_alturas', 'conductor', 'Curso Trabajo en Alturas', 'Certificacion para trabajo seguro en alturas', true, ARRAY['conductor'], false),

  -- Polizas
  ('poliza_todo_riesgo_cabezote', 'polizas', 'Poliza Todo Riesgo Cabezote', 'Seguro todo riesgo para el cabezote', true, ARRAY['vehiculo'], false),
  ('poliza_todo_riesgo_tanque', 'polizas', 'Poliza Todo Riesgo Tanque', 'Seguro todo riesgo para el tanque', true, ARRAY['remolque'], false),
  ('poliza_decreto_1079', 'polizas', 'Poliza Decreto 1079/2015', 'Poliza segun decreto 1079 de 2015', true, ARRAY['vehiculo'], false),
  ('poliza_rce_copetran', 'polizas', 'Poliza RCE Copetran', 'Poliza de Responsabilidad Civil Extracontractual Copetran', true, ARRAY['vehiculo'], true),
  ('poliza_rce_exceso_copetran', 'polizas', 'Poliza RCE en Exceso Copetran', 'Poliza RCE en exceso certificada por Copetran', true, ARRAY['vehiculo'], true);
