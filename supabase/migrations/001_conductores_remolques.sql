-- =============================================
-- SVD Trucks - Migración: Conductores y Remolques
-- =============================================

-- =============================================
-- TABLA: conductores
-- =============================================

CREATE TABLE public.conductores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre TEXT NOT NULL,
  cedula TEXT UNIQUE,
  telefono TEXT,
  direccion TEXT,
  licencia_numero TEXT,
  licencia_categoria TEXT,
  licencia_vencimiento DATE,
  fecha_ingreso DATE,
  activo BOOLEAN NOT NULL DEFAULT true,
  notas TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- TABLA: remolques
-- =============================================

CREATE TYPE estado_remolque AS ENUM ('activo', 'en_mantenimiento', 'inactivo');

CREATE TABLE public.remolques (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  placa TEXT NOT NULL UNIQUE,
  tipo TEXT, -- tanque, plataforma, furgon, etc.
  capacidad TEXT,
  año INTEGER,
  estado estado_remolque NOT NULL DEFAULT 'activo',
  notas TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- Agregar relaciones a vehiculos
-- =============================================

ALTER TABLE public.vehiculos
  ADD COLUMN conductor_id UUID REFERENCES public.conductores(id) ON DELETE SET NULL,
  ADD COLUMN remolque_id UUID REFERENCES public.remolques(id) ON DELETE SET NULL;

-- =============================================
-- Indices
-- =============================================

CREATE INDEX idx_conductores_cedula ON public.conductores(cedula);
CREATE INDEX idx_conductores_activo ON public.conductores(activo);
CREATE INDEX idx_remolques_placa ON public.remolques(placa);
CREATE INDEX idx_vehiculos_conductor ON public.vehiculos(conductor_id);
CREATE INDEX idx_vehiculos_remolque ON public.vehiculos(remolque_id);

-- =============================================
-- Triggers para updated_at
-- =============================================

CREATE TRIGGER update_conductores_updated_at
  BEFORE UPDATE ON public.conductores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_remolques_updated_at
  BEFORE UPDATE ON public.remolques
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- Row Level Security
-- =============================================

ALTER TABLE public.conductores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.remolques ENABLE ROW LEVEL SECURITY;

-- Politicas de lectura
CREATE POLICY "Usuarios autenticados pueden ver conductores"
  ON public.conductores FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuarios autenticados pueden ver remolques"
  ON public.remolques FOR SELECT
  TO authenticated
  USING (true);

-- Politicas de escritura (solo admins)
CREATE POLICY "Admins pueden insertar conductores"
  ON public.conductores FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Admins pueden actualizar conductores"
  ON public.conductores FOR UPDATE
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins pueden eliminar conductores"
  ON public.conductores FOR DELETE
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins pueden insertar remolques"
  ON public.remolques FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Admins pueden actualizar remolques"
  ON public.remolques FOR UPDATE
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins pueden eliminar remolques"
  ON public.remolques FOR DELETE
  TO authenticated
  USING (is_admin());
