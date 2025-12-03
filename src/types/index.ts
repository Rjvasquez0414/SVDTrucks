// Tipos principales para SVD Trucks

export type TipoVehiculo = 'camion' | 'tractomula' | 'volqueta';
export type EstadoVehiculo = 'activo' | 'en_mantenimiento' | 'inactivo';
export type TipoMantenimiento = 'preventivo' | 'correctivo';
export type PrioridadAlerta = 'alta' | 'media' | 'baja';
export type EstadoAlerta = 'pendiente' | 'atendida' | 'descartada';

export type CategoriaMantenimiento =
  | 'cambio_aceite'
  | 'filtro_aceite'
  | 'filtro_aire'
  | 'filtro_combustible'
  | 'liquido_refrigerante'
  | 'liquido_frenos'
  | 'pastillas_frenos'
  | 'discos_frenos'
  | 'rotacion_llantas'
  | 'alineacion_balanceo'
  | 'cambio_llantas'
  | 'bandas_correas'
  | 'bateria'
  | 'transmision'
  | 'suspension'
  | 'sistema_electrico'
  | 'reparacion_motor'
  | 'otro';

export type TipoAlerta =
  | 'mantenimiento_kilometraje'
  | 'mantenimiento_tiempo'
  | 'vencimiento_soat'
  | 'vencimiento_tecnomecanica'
  | 'vehiculo_inactivo';

export interface Vehiculo {
  id: string;
  placa: string;
  marca: string;
  modelo: string;
  año: number;
  tipo: TipoVehiculo;
  kilometraje: number;
  estado: EstadoVehiculo;
  fechaAdquisicion: string;
  proximaRevision: string;
  vencimientoSOAT: string;
  vencimientoTecnicomecanica: string;
  color?: string;
  numeroMotor?: string;
  numeroChasis?: string;
}

export interface Repuesto {
  id: string;
  nombre: string;
  cantidad: number;
  costoUnitario: number;
}

export interface Mantenimiento {
  id: string;
  vehiculoId: string;
  tipo: TipoMantenimiento;
  categoria: CategoriaMantenimiento;
  descripcion: string;
  fecha: string;
  kilometraje: number;
  costo: number;
  proveedor?: string;
  repuestos: Repuesto[];
  observaciones?: string;
  proximoMantenimiento?: {
    kilometraje?: number;
    fecha?: string;
  };
}

export interface Alerta {
  id: string;
  vehiculoId: string;
  tipo: TipoAlerta;
  prioridad: PrioridadAlerta;
  mensaje: string;
  fechaGenerada: string;
  estado: EstadoAlerta;
  kilometrajeActual?: number;
  kilometrajeLimite?: number;
  fechaLimite?: string;
}

export interface CatalogoMantenimiento {
  categoria: CategoriaMantenimiento;
  nombre: string;
  descripcion: string;
  intervaloKm?: number;
  intervaloMeses?: number;
  tipo: TipoMantenimiento;
}

// Estadísticas para el dashboard
export interface EstadisticasFlota {
  totalVehiculos: number;
  vehiculosActivos: number;
  vehiculosEnMantenimiento: number;
  vehiculosInactivos: number;
  alertasPendientes: number;
  mantenimientosMes: number;
  costoTotalMes: number;
  costoTotalAnterior: number;
}
