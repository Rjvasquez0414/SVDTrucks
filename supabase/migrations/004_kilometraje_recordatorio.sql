-- Migration: Agregar campo para rastrear ultima actualizacion de kilometraje
-- y nuevo tipo de alerta para recordatorios

-- 1. Agregar columna kilometraje_updated_at a vehiculos
ALTER TABLE public.vehiculos
ADD COLUMN IF NOT EXISTS kilometraje_updated_at TIMESTAMPTZ DEFAULT NOW();

-- 2. Agregar nuevo valor al enum tipo_alerta
ALTER TYPE tipo_alerta ADD VALUE IF NOT EXISTS 'actualizar_kilometraje';

-- 3. Actualizar los vehiculos existentes con la fecha actual
UPDATE public.vehiculos
SET kilometraje_updated_at = NOW()
WHERE kilometraje_updated_at IS NULL;

-- 4. Comentario explicativo
COMMENT ON COLUMN public.vehiculos.kilometraje_updated_at IS
  'Fecha de la ultima actualizacion del kilometraje. Se usa para generar recordatorios cada 2 dias.';
