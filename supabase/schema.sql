-- =============================================
-- SVD Trucks - Esquema de Base de Datos
-- =============================================

-- Habilitar extension UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- TIPOS ENUM
-- =============================================

CREATE TYPE tipo_vehiculo AS ENUM ('camion', 'tractomula', 'volqueta');
CREATE TYPE estado_vehiculo AS ENUM ('activo', 'en_mantenimiento', 'inactivo');
CREATE TYPE tipo_mantenimiento AS ENUM ('preventivo', 'correctivo');
CREATE TYPE prioridad_alerta AS ENUM ('alta', 'media', 'baja');
CREATE TYPE estado_alerta AS ENUM ('pendiente', 'atendida', 'descartada');
CREATE TYPE categoria_mantenimiento AS ENUM (
  'cambio_aceite',
  'filtro_aceite',
  'filtro_aire',
  'filtro_combustible',
  'liquido_refrigerante',
  'liquido_frenos',
  'pastillas_frenos',
  'discos_frenos',
  'rotacion_llantas',
  'alineacion_balanceo',
  'cambio_llantas',
  'bandas_correas',
  'bateria',
  'transmision',
  'suspension',
  'sistema_electrico',
  'reparacion_motor',
  'otro'
);
CREATE TYPE tipo_alerta AS ENUM (
  'mantenimiento_kilometraje',
  'mantenimiento_tiempo',
  'vencimiento_soat',
  'vencimiento_tecnomecanica',
  'vehiculo_inactivo'
);
CREATE TYPE rol_usuario AS ENUM ('administrador', 'operador');

-- =============================================
-- TABLA: usuarios (extendida de auth.users)
-- =============================================

CREATE TABLE public.usuarios (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  rol rol_usuario NOT NULL DEFAULT 'operador',
  avatar_url TEXT,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- TABLA: vehiculos
-- =============================================

CREATE TABLE public.vehiculos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  placa TEXT NOT NULL UNIQUE,
  marca TEXT NOT NULL,
  modelo TEXT NOT NULL,
  año INTEGER NOT NULL,
  tipo tipo_vehiculo NOT NULL,
  kilometraje INTEGER NOT NULL DEFAULT 0,
  estado estado_vehiculo NOT NULL DEFAULT 'activo',
  fecha_adquisicion DATE NOT NULL,
  proxima_revision DATE,
  vencimiento_soat DATE,
  vencimiento_tecnomecanica DATE,
  color TEXT,
  numero_motor TEXT,
  numero_chasis TEXT,
  imagen_url TEXT,
  notas TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- TABLA: mantenimientos
-- =============================================

CREATE TABLE public.mantenimientos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehiculo_id UUID NOT NULL REFERENCES public.vehiculos(id) ON DELETE CASCADE,
  tipo tipo_mantenimiento NOT NULL,
  categoria categoria_mantenimiento NOT NULL,
  descripcion TEXT NOT NULL,
  fecha DATE NOT NULL,
  kilometraje INTEGER NOT NULL,
  costo DECIMAL(12,2) NOT NULL DEFAULT 0,
  proveedor TEXT,
  observaciones TEXT,
  proximo_km INTEGER,
  proxima_fecha DATE,
  created_by UUID REFERENCES public.usuarios(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- TABLA: repuestos (de mantenimientos)
-- =============================================

CREATE TABLE public.repuestos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mantenimiento_id UUID NOT NULL REFERENCES public.mantenimientos(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  cantidad INTEGER NOT NULL DEFAULT 1,
  costo_unitario DECIMAL(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- TABLA: alertas
-- =============================================

CREATE TABLE public.alertas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehiculo_id UUID NOT NULL REFERENCES public.vehiculos(id) ON DELETE CASCADE,
  tipo tipo_alerta NOT NULL,
  prioridad prioridad_alerta NOT NULL,
  mensaje TEXT NOT NULL,
  fecha_generada TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  estado estado_alerta NOT NULL DEFAULT 'pendiente',
  kilometraje_actual INTEGER,
  kilometraje_limite INTEGER,
  fecha_limite DATE,
  atendida_por UUID REFERENCES public.usuarios(id),
  atendida_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- TABLA: catalogo_mantenimiento
-- =============================================

CREATE TABLE public.catalogo_mantenimiento (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  categoria categoria_mantenimiento NOT NULL UNIQUE,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  intervalo_km INTEGER,
  intervalo_meses INTEGER,
  tipo tipo_mantenimiento NOT NULL DEFAULT 'preventivo',
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- INDICES para mejor rendimiento
-- =============================================

CREATE INDEX idx_vehiculos_placa ON public.vehiculos(placa);
CREATE INDEX idx_vehiculos_estado ON public.vehiculos(estado);
CREATE INDEX idx_mantenimientos_vehiculo ON public.mantenimientos(vehiculo_id);
CREATE INDEX idx_mantenimientos_fecha ON public.mantenimientos(fecha DESC);
CREATE INDEX idx_alertas_vehiculo ON public.alertas(vehiculo_id);
CREATE INDEX idx_alertas_estado ON public.alertas(estado);
CREATE INDEX idx_alertas_prioridad ON public.alertas(prioridad);

-- =============================================
-- TRIGGERS para updated_at
-- =============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_usuarios_updated_at
  BEFORE UPDATE ON public.usuarios
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vehiculos_updated_at
  BEFORE UPDATE ON public.vehiculos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mantenimientos_updated_at
  BEFORE UPDATE ON public.mantenimientos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_alertas_updated_at
  BEFORE UPDATE ON public.alertas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehiculos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mantenimientos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.repuestos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alertas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalogo_mantenimiento ENABLE ROW LEVEL SECURITY;

-- Politicas: usuarios autenticados pueden leer todo
CREATE POLICY "Usuarios autenticados pueden ver vehiculos"
  ON public.vehiculos FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuarios autenticados pueden ver mantenimientos"
  ON public.mantenimientos FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuarios autenticados pueden ver repuestos"
  ON public.repuestos FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuarios autenticados pueden ver alertas"
  ON public.alertas FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuarios autenticados pueden ver catalogo"
  ON public.catalogo_mantenimiento FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuarios pueden ver su propio perfil"
  ON public.usuarios FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Politicas de escritura (solo administradores - implementar funcion helper)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.usuarios
    WHERE id = auth.uid() AND rol = 'administrador'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE POLICY "Admins pueden insertar vehiculos"
  ON public.vehiculos FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Admins pueden actualizar vehiculos"
  ON public.vehiculos FOR UPDATE
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins pueden eliminar vehiculos"
  ON public.vehiculos FOR DELETE
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins pueden insertar mantenimientos"
  ON public.mantenimientos FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Admins pueden actualizar mantenimientos"
  ON public.mantenimientos FOR UPDATE
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins pueden insertar repuestos"
  ON public.repuestos FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Admins pueden actualizar alertas"
  ON public.alertas FOR UPDATE
  TO authenticated
  USING (is_admin());

-- =============================================
-- DATOS INICIALES: Catalogo de mantenimiento
-- =============================================

INSERT INTO public.catalogo_mantenimiento (categoria, nombre, descripcion, intervalo_km, intervalo_meses, tipo) VALUES
  ('cambio_aceite', 'Cambio de Aceite Motor', 'Cambio de aceite del motor y revision de niveles', 10000, 3, 'preventivo'),
  ('filtro_aceite', 'Filtro de Aceite', 'Reemplazo del filtro de aceite del motor', 10000, 3, 'preventivo'),
  ('filtro_aire', 'Filtro de Aire', 'Reemplazo del filtro de aire del motor', 20000, 6, 'preventivo'),
  ('filtro_combustible', 'Filtro de Combustible', 'Reemplazo del filtro de combustible', 30000, 6, 'preventivo'),
  ('liquido_refrigerante', 'Liquido Refrigerante', 'Cambio de liquido refrigerante del sistema de enfriamiento', 50000, 12, 'preventivo'),
  ('liquido_frenos', 'Liquido de Frenos', 'Cambio de liquido del sistema de frenos', 40000, 24, 'preventivo'),
  ('pastillas_frenos', 'Pastillas de Frenos', 'Reemplazo de pastillas del sistema de frenos', 60000, NULL, 'preventivo'),
  ('discos_frenos', 'Discos de Frenos', 'Reemplazo de discos del sistema de frenos', 100000, NULL, 'preventivo'),
  ('rotacion_llantas', 'Rotacion de Llantas', 'Rotacion de llantas para desgaste uniforme', 15000, NULL, 'preventivo'),
  ('alineacion_balanceo', 'Alineacion y Balanceo', 'Alineacion de direccion y balanceo de ruedas', 20000, 6, 'preventivo'),
  ('cambio_llantas', 'Cambio de Llantas', 'Reemplazo de llantas desgastadas', 80000, NULL, 'preventivo'),
  ('bandas_correas', 'Bandas y Correas', 'Revision y cambio de bandas y correas del motor', 80000, NULL, 'preventivo'),
  ('bateria', 'Bateria', 'Revision o reemplazo de bateria', NULL, 36, 'preventivo'),
  ('transmision', 'Transmision', 'Cambio de aceite de transmision y revision', 60000, NULL, 'preventivo'),
  ('suspension', 'Suspension', 'Revision y reparacion del sistema de suspension', NULL, NULL, 'correctivo'),
  ('sistema_electrico', 'Sistema Electrico', 'Reparacion de componentes electricos', NULL, NULL, 'correctivo'),
  ('reparacion_motor', 'Reparacion de Motor', 'Reparacion mayor del motor', NULL, NULL, 'correctivo'),
  ('otro', 'Otro', 'Otros mantenimientos no categorizados', NULL, NULL, 'correctivo');
