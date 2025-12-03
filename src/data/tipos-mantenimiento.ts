import { CatalogoMantenimiento } from '@/types';

export const catalogoMantenimiento: CatalogoMantenimiento[] = [
  {
    categoria: 'cambio_aceite',
    nombre: 'Cambio de Aceite Motor',
    descripcion: 'Reemplazo del aceite del motor y revisión de niveles',
    intervaloKm: 15000,
    intervaloMeses: 3,
    tipo: 'preventivo',
  },
  {
    categoria: 'filtro_aceite',
    nombre: 'Filtro de Aceite',
    descripcion: 'Reemplazo del filtro de aceite del motor',
    intervaloKm: 15000,
    intervaloMeses: 3,
    tipo: 'preventivo',
  },
  {
    categoria: 'filtro_aire',
    nombre: 'Filtro de Aire',
    descripcion: 'Reemplazo del filtro de aire del motor',
    intervaloKm: 25000,
    intervaloMeses: 6,
    tipo: 'preventivo',
  },
  {
    categoria: 'filtro_combustible',
    nombre: 'Filtro de Combustible',
    descripcion: 'Reemplazo del filtro de combustible',
    intervaloKm: 30000,
    intervaloMeses: 6,
    tipo: 'preventivo',
  },
  {
    categoria: 'liquido_refrigerante',
    nombre: 'Liquido Refrigerante',
    descripcion: 'Cambio de liquido refrigerante del sistema de enfriamiento',
    intervaloKm: 50000,
    intervaloMeses: 12,
    tipo: 'preventivo',
  },
  {
    categoria: 'liquido_frenos',
    nombre: 'Liquido de Frenos',
    descripcion: 'Cambio del liquido del sistema de frenos',
    intervaloKm: 40000,
    intervaloMeses: 24,
    tipo: 'preventivo',
  },
  {
    categoria: 'pastillas_frenos',
    nombre: 'Pastillas de Frenos',
    descripcion: 'Reemplazo de las pastillas del sistema de frenos',
    intervaloKm: 60000,
    tipo: 'preventivo',
  },
  {
    categoria: 'discos_frenos',
    nombre: 'Discos de Frenos',
    descripcion: 'Reemplazo de los discos del sistema de frenos',
    intervaloKm: 100000,
    tipo: 'preventivo',
  },
  {
    categoria: 'rotacion_llantas',
    nombre: 'Rotacion de Llantas',
    descripcion: 'Rotacion de las llantas para desgaste uniforme',
    intervaloKm: 12000,
    tipo: 'preventivo',
  },
  {
    categoria: 'alineacion_balanceo',
    nombre: 'Alineacion y Balanceo',
    descripcion: 'Alineacion de direccion y balanceo de llantas',
    intervaloKm: 20000,
    intervaloMeses: 6,
    tipo: 'preventivo',
  },
  {
    categoria: 'cambio_llantas',
    nombre: 'Cambio de Llantas',
    descripcion: 'Reemplazo completo de llantas',
    intervaloKm: 80000,
    tipo: 'preventivo',
  },
  {
    categoria: 'bandas_correas',
    nombre: 'Bandas y Correas',
    descripcion: 'Revision y reemplazo de bandas y correas del motor',
    intervaloKm: 80000,
    tipo: 'preventivo',
  },
  {
    categoria: 'bateria',
    nombre: 'Bateria',
    descripcion: 'Revision o reemplazo de la bateria del vehiculo',
    intervaloMeses: 30,
    tipo: 'preventivo',
  },
  {
    categoria: 'transmision',
    nombre: 'Aceite de Transmision',
    descripcion: 'Cambio de aceite de la transmision',
    intervaloKm: 60000,
    tipo: 'preventivo',
  },
  {
    categoria: 'suspension',
    nombre: 'Sistema de Suspension',
    descripcion: 'Revision y reparacion del sistema de suspension',
    tipo: 'correctivo',
  },
  {
    categoria: 'sistema_electrico',
    nombre: 'Sistema Electrico',
    descripcion: 'Reparacion de componentes del sistema electrico',
    tipo: 'correctivo',
  },
  {
    categoria: 'reparacion_motor',
    nombre: 'Reparacion de Motor',
    descripcion: 'Reparacion mayor del motor',
    tipo: 'correctivo',
  },
  {
    categoria: 'otro',
    nombre: 'Otro',
    descripcion: 'Otros tipos de mantenimiento o reparacion',
    tipo: 'correctivo',
  },
];

export function getCategoriaInfo(categoria: string): CatalogoMantenimiento | undefined {
  return catalogoMantenimiento.find((c) => c.categoria === categoria);
}

export function getCategoriasPreventivas(): CatalogoMantenimiento[] {
  return catalogoMantenimiento.filter((c) => c.tipo === 'preventivo');
}

export function getCategoriasCorrectivas(): CatalogoMantenimiento[] {
  return catalogoMantenimiento.filter((c) => c.tipo === 'correctivo');
}
