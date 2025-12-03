import { Alerta } from '@/types';

// Alertas pre-generadas para el prototipo
export const alertas: Alerta[] = [
  {
    id: 'a001',
    vehiculoId: 'v001',
    tipo: 'mantenimiento_kilometraje',
    prioridad: 'alta',
    mensaje: 'Cambio de aceite pendiente - ABC-123',
    fechaGenerada: '2024-02-25',
    estado: 'pendiente',
    kilometrajeActual: 185420,
    kilometrajeLimite: 185000,
  },
  {
    id: 'a002',
    vehiculoId: 'v002',
    tipo: 'vencimiento_soat',
    prioridad: 'media',
    mensaje: 'SOAT proximo a vencer - DEF-456',
    fechaGenerada: '2024-02-20',
    estado: 'pendiente',
    fechaLimite: '2024-05-15',
  },
  {
    id: 'a003',
    vehiculoId: 'v002',
    tipo: 'mantenimiento_kilometraje',
    prioridad: 'media',
    mensaje: 'Alineacion y balanceo pendiente - DEF-456',
    fechaGenerada: '2024-02-22',
    estado: 'pendiente',
    kilometrajeActual: 142300,
    kilometrajeLimite: 150000,
  },
  {
    id: 'a004',
    vehiculoId: 'v003',
    tipo: 'mantenimiento_tiempo',
    prioridad: 'alta',
    mensaje: 'Vehiculo en taller por mas de 5 dias - GHI-789',
    fechaGenerada: '2024-02-25',
    estado: 'pendiente',
  },
  {
    id: 'a005',
    vehiculoId: 'v006',
    tipo: 'vencimiento_soat',
    prioridad: 'alta',
    mensaje: 'SOAT vencido - PQR-678',
    fechaGenerada: '2024-02-01',
    estado: 'pendiente',
    fechaLimite: '2024-04-30',
  },
  {
    id: 'a006',
    vehiculoId: 'v006',
    tipo: 'vencimiento_tecnomecanica',
    prioridad: 'alta',
    mensaje: 'Revision tecnicomecanica vencida - PQR-678',
    fechaGenerada: '2024-02-01',
    estado: 'pendiente',
    fechaLimite: '2024-05-10',
  },
  {
    id: 'a007',
    vehiculoId: 'v006',
    tipo: 'vehiculo_inactivo',
    prioridad: 'baja',
    mensaje: 'Vehiculo inactivo por mas de 30 dias - PQR-678',
    fechaGenerada: '2024-02-15',
    estado: 'pendiente',
  },
  {
    id: 'a008',
    vehiculoId: 'v005',
    tipo: 'mantenimiento_kilometraje',
    prioridad: 'media',
    mensaje: 'Cambio de aceite proximo - MNO-345',
    fechaGenerada: '2024-02-23',
    estado: 'pendiente',
    kilometrajeActual: 165200,
    kilometrajeLimite: 170000,
  },
  {
    id: 'a009',
    vehiculoId: 'v004',
    tipo: 'mantenimiento_kilometraje',
    prioridad: 'baja',
    mensaje: 'Cambio de aceite programado - JKL-012',
    fechaGenerada: '2024-02-24',
    estado: 'pendiente',
    kilometrajeActual: 78500,
    kilometrajeLimite: 80000,
  },
  {
    id: 'a010',
    vehiculoId: 'v007',
    tipo: 'vencimiento_tecnomecanica',
    prioridad: 'media',
    mensaje: 'Revision tecnicomecanica proxima - STU-901',
    fechaGenerada: '2024-02-20',
    estado: 'pendiente',
    fechaLimite: '2024-08-30',
  },
  {
    id: 'a011',
    vehiculoId: 'v008',
    tipo: 'mantenimiento_kilometraje',
    prioridad: 'media',
    mensaje: 'Rotacion de llantas pendiente - VWX-234',
    fechaGenerada: '2024-02-22',
    estado: 'pendiente',
    kilometrajeActual: 112800,
    kilometrajeLimite: 120000,
  },
];

export function getAlertasPendientes(): Alerta[] {
  return alertas
    .filter((a) => a.estado === 'pendiente')
    .sort((a, b) => {
      const prioridadOrden = { alta: 0, media: 1, baja: 2 };
      return prioridadOrden[a.prioridad] - prioridadOrden[b.prioridad];
    });
}

export function getAlertasByVehiculo(vehiculoId: string): Alerta[] {
  return alertas.filter((a) => a.vehiculoId === vehiculoId && a.estado === 'pendiente');
}

export function getAlertasByPrioridad(prioridad: 'alta' | 'media' | 'baja'): Alerta[] {
  return alertas.filter((a) => a.prioridad === prioridad && a.estado === 'pendiente');
}

export function contarAlertasPorPrioridad(): { alta: number; media: number; baja: number } {
  const pendientes = getAlertasPendientes();
  return {
    alta: pendientes.filter((a) => a.prioridad === 'alta').length,
    media: pendientes.filter((a) => a.prioridad === 'media').length,
    baja: pendientes.filter((a) => a.prioridad === 'baja').length,
  };
}
