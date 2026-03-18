-- Agregar columna costo_total a repuestos para guardar el costo total directo
-- sin necesidad de calcular costo_unitario * cantidad (que causa perdida de precision)
ALTER TABLE public.repuestos ADD COLUMN IF NOT EXISTS costo_total DECIMAL(12,2) NOT NULL DEFAULT 0;

-- Migrar datos existentes: recalcular costo_total desde costo_unitario * cantidad
UPDATE public.repuestos SET costo_total = costo_unitario * cantidad WHERE costo_total = 0;
