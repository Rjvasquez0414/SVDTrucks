-- Migration: Agregar campo de imagenes a mantenimientos

-- Agregar columna para URLs de imagenes
ALTER TABLE public.mantenimientos
ADD COLUMN IF NOT EXISTS imagenes TEXT[] DEFAULT '{}';

-- Comentario explicativo
COMMENT ON COLUMN public.mantenimientos.imagenes IS
  'Array de URLs de imagenes asociadas al mantenimiento (almacenadas en Supabase Storage)';
