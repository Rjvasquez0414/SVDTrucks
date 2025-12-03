import { Mantenimiento } from '@/types';

export const mantenimientos: Mantenimiento[] = [
  // Vehículo v001 - ABC-123 (Kenworth T800)
  {
    id: 'm001',
    vehiculoId: 'v001',
    tipo: 'preventivo',
    categoria: 'cambio_aceite',
    descripcion: 'Cambio de aceite motor y filtro',
    fecha: '2024-01-15',
    kilometraje: 170000,
    costo: 850000,
    proveedor: 'Lubricentro El Camionero',
    repuestos: [
      { id: 'r001', nombre: 'Aceite Motor 15W-40 (20L)', cantidad: 1, costoUnitario: 450000 },
      { id: 'r002', nombre: 'Filtro de Aceite', cantidad: 1, costoUnitario: 85000 },
    ],
    proximoMantenimiento: { kilometraje: 185000 },
  },
  {
    id: 'm002',
    vehiculoId: 'v001',
    tipo: 'preventivo',
    categoria: 'filtro_aire',
    descripcion: 'Cambio de filtro de aire',
    fecha: '2024-01-15',
    kilometraje: 170000,
    costo: 180000,
    proveedor: 'Lubricentro El Camionero',
    repuestos: [
      { id: 'r003', nombre: 'Filtro de Aire Principal', cantidad: 1, costoUnitario: 150000 },
    ],
    proximoMantenimiento: { kilometraje: 195000 },
  },
  {
    id: 'm003',
    vehiculoId: 'v001',
    tipo: 'correctivo',
    categoria: 'sistema_electrico',
    descripcion: 'Reparacion de alternador',
    fecha: '2023-11-20',
    kilometraje: 158000,
    costo: 1200000,
    proveedor: 'Electricos del Norte',
    repuestos: [
      { id: 'r004', nombre: 'Alternador Remanufacturado', cantidad: 1, costoUnitario: 950000 },
    ],
    observaciones: 'Se detecto falla en el sistema de carga. Se reemplazo alternador completo.',
  },

  // Vehículo v002 - DEF-456 (Freightliner Cascadia)
  {
    id: 'm004',
    vehiculoId: 'v002',
    tipo: 'preventivo',
    categoria: 'cambio_aceite',
    descripcion: 'Cambio de aceite y filtros',
    fecha: '2024-02-01',
    kilometraje: 135000,
    costo: 920000,
    proveedor: 'Serviteca Premium',
    repuestos: [
      { id: 'r005', nombre: 'Aceite Sintetico 5W-40 (22L)', cantidad: 1, costoUnitario: 580000 },
      { id: 'r006', nombre: 'Filtro de Aceite Premium', cantidad: 1, costoUnitario: 120000 },
    ],
    proximoMantenimiento: { kilometraje: 150000 },
  },
  {
    id: 'm005',
    vehiculoId: 'v002',
    tipo: 'preventivo',
    categoria: 'alineacion_balanceo',
    descripcion: 'Alineacion y balanceo completo',
    fecha: '2024-01-10',
    kilometraje: 130000,
    costo: 350000,
    proveedor: 'Llantas y Rines Express',
    repuestos: [],
    proximoMantenimiento: { kilometraje: 150000 },
  },

  // Vehículo v003 - GHI-789 (International ProStar) - En mantenimiento
  {
    id: 'm006',
    vehiculoId: 'v003',
    tipo: 'correctivo',
    categoria: 'reparacion_motor',
    descripcion: 'Reparacion de culata - Empaque soplado',
    fecha: '2024-02-20',
    kilometraje: 215600,
    costo: 4500000,
    proveedor: 'Talleres Diesel Master',
    repuestos: [
      { id: 'r007', nombre: 'Kit Empaque de Culata', cantidad: 1, costoUnitario: 850000 },
      { id: 'r008', nombre: 'Tornillos de Culata', cantidad: 24, costoUnitario: 25000 },
      { id: 'r009', nombre: 'Rectificacion de Culata', cantidad: 1, costoUnitario: 1200000 },
    ],
    observaciones: 'Vehiculo presento sobrecalentamiento. Se encontro empaque de culata danado. Requiere rectificacion.',
  },

  // Vehículo v004 - JKL-012 (Volvo VNL 760)
  {
    id: 'm007',
    vehiculoId: 'v004',
    tipo: 'preventivo',
    categoria: 'cambio_aceite',
    descripcion: 'Primer cambio de aceite',
    fecha: '2023-08-15',
    kilometraje: 45000,
    costo: 980000,
    proveedor: 'Volvo Service Center',
    repuestos: [
      { id: 'r010', nombre: 'Aceite Volvo Original (25L)', cantidad: 1, costoUnitario: 720000 },
      { id: 'r011', nombre: 'Filtro Aceite Original Volvo', cantidad: 1, costoUnitario: 180000 },
    ],
    proximoMantenimiento: { kilometraje: 60000 },
  },
  {
    id: 'm008',
    vehiculoId: 'v004',
    tipo: 'preventivo',
    categoria: 'cambio_aceite',
    descripcion: 'Segundo cambio de aceite',
    fecha: '2024-01-20',
    kilometraje: 65000,
    costo: 980000,
    proveedor: 'Volvo Service Center',
    repuestos: [
      { id: 'r012', nombre: 'Aceite Volvo Original (25L)', cantidad: 1, costoUnitario: 720000 },
      { id: 'r013', nombre: 'Filtro Aceite Original Volvo', cantidad: 1, costoUnitario: 180000 },
    ],
    proximoMantenimiento: { kilometraje: 80000 },
  },

  // Vehículo v005 - MNO-345 (Mack Anthem)
  {
    id: 'm009',
    vehiculoId: 'v005',
    tipo: 'preventivo',
    categoria: 'pastillas_frenos',
    descripcion: 'Cambio de pastillas de frenos delanteras',
    fecha: '2024-02-05',
    kilometraje: 160000,
    costo: 1800000,
    proveedor: 'Frenos y Embragues del Sur',
    repuestos: [
      { id: 'r014', nombre: 'Kit Pastillas Delanteras', cantidad: 1, costoUnitario: 650000 },
      { id: 'r015', nombre: 'Sensores de Desgaste', cantidad: 2, costoUnitario: 120000 },
    ],
    proximoMantenimiento: { kilometraje: 220000 },
  },
  {
    id: 'm010',
    vehiculoId: 'v005',
    tipo: 'preventivo',
    categoria: 'cambio_aceite',
    descripcion: 'Cambio de aceite programado',
    fecha: '2024-01-25',
    kilometraje: 155000,
    costo: 850000,
    proveedor: 'Lubricentro El Camionero',
    repuestos: [
      { id: 'r016', nombre: 'Aceite Motor 15W-40 (20L)', cantidad: 1, costoUnitario: 450000 },
      { id: 'r017', nombre: 'Filtro de Aceite', cantidad: 1, costoUnitario: 85000 },
    ],
    proximoMantenimiento: { kilometraje: 170000 },
  },

  // Vehículo v007 - STU-901 (Hino 500)
  {
    id: 'm011',
    vehiculoId: 'v007',
    tipo: 'preventivo',
    categoria: 'cambio_aceite',
    descripcion: 'Mantenimiento rutinario',
    fecha: '2024-02-10',
    kilometraje: 90000,
    costo: 650000,
    proveedor: 'Hino Center',
    repuestos: [
      { id: 'r018', nombre: 'Aceite Motor (15L)', cantidad: 1, costoUnitario: 380000 },
      { id: 'r019', nombre: 'Filtro de Aceite Hino', cantidad: 1, costoUnitario: 95000 },
    ],
    proximoMantenimiento: { kilometraje: 105000 },
  },

  // Vehículo v008 - VWX-234 (Chevrolet NKR)
  {
    id: 'm012',
    vehiculoId: 'v008',
    tipo: 'preventivo',
    categoria: 'rotacion_llantas',
    descripcion: 'Rotacion de llantas y revision',
    fecha: '2024-01-30',
    kilometraje: 108000,
    costo: 120000,
    proveedor: 'Llantas y Rines Express',
    repuestos: [],
    proximoMantenimiento: { kilometraje: 120000 },
  },
  {
    id: 'm013',
    vehiculoId: 'v008',
    tipo: 'correctivo',
    categoria: 'suspension',
    descripcion: 'Reemplazo de amortiguadores traseros',
    fecha: '2023-12-15',
    kilometraje: 100000,
    costo: 1400000,
    proveedor: 'Suspensiones Pro',
    repuestos: [
      { id: 'r020', nombre: 'Amortiguadores Traseros (Par)', cantidad: 1, costoUnitario: 980000 },
      { id: 'r021', nombre: 'Bujes de Suspension', cantidad: 4, costoUnitario: 45000 },
    ],
    observaciones: 'Se detecto desgaste excesivo en amortiguadores. Reemplazo preventivo.',
  },

  // Vehículo v009 - YZA-567 (JAC HFC1035)
  {
    id: 'm014',
    vehiculoId: 'v009',
    tipo: 'preventivo',
    categoria: 'cambio_aceite',
    descripcion: 'Primer cambio de aceite',
    fecha: '2023-12-20',
    kilometraje: 30000,
    costo: 480000,
    proveedor: 'JAC Service',
    repuestos: [
      { id: 'r022', nombre: 'Aceite Motor (10L)', cantidad: 1, costoUnitario: 320000 },
      { id: 'r023', nombre: 'Filtro de Aceite JAC', cantidad: 1, costoUnitario: 65000 },
    ],
    proximoMantenimiento: { kilometraje: 45000 },
  },

  // Vehículo v010 - BCD-890 (Foton Auman)
  {
    id: 'm015',
    vehiculoId: 'v010',
    tipo: 'preventivo',
    categoria: 'cambio_aceite',
    descripcion: 'Cambio de aceite y revision general',
    fecha: '2024-02-08',
    kilometraje: 175000,
    costo: 720000,
    proveedor: 'Foton Service',
    repuestos: [
      { id: 'r024', nombre: 'Aceite Motor (18L)', cantidad: 1, costoUnitario: 420000 },
      { id: 'r025', nombre: 'Filtro de Aceite', cantidad: 1, costoUnitario: 75000 },
      { id: 'r026', nombre: 'Filtro de Combustible', cantidad: 1, costoUnitario: 85000 },
    ],
    proximoMantenimiento: { kilometraje: 190000 },
  },
  {
    id: 'm016',
    vehiculoId: 'v010',
    tipo: 'preventivo',
    categoria: 'cambio_llantas',
    descripcion: 'Cambio de llantas traseras',
    fecha: '2024-01-05',
    kilometraje: 170000,
    costo: 4800000,
    proveedor: 'Llantas y Rines Express',
    repuestos: [
      { id: 'r027', nombre: 'Llantas 11R22.5', cantidad: 4, costoUnitario: 1100000 },
    ],
    observaciones: 'Llantas traseras con desgaste al limite. Cambio completo del eje trasero.',
  },
];

export function getMantenimientosByVehiculo(vehiculoId: string): Mantenimiento[] {
  return mantenimientos
    .filter((m) => m.vehiculoId === vehiculoId)
    .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
}

export function getUltimosMantenimientos(limit: number = 10): Mantenimiento[] {
  return [...mantenimientos]
    .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
    .slice(0, limit);
}

export function getMantenimientosMes(año: number, mes: number): Mantenimiento[] {
  return mantenimientos.filter((m) => {
    const fecha = new Date(m.fecha);
    return fecha.getFullYear() === año && fecha.getMonth() === mes;
  });
}

export function getCostoTotalMes(año: number, mes: number): number {
  return getMantenimientosMes(año, mes).reduce((total, m) => total + m.costo, 0);
}
