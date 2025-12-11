// Tipos generados para Supabase
// Este archivo define la estructura de la base de datos para tipado en TypeScript

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// Enums de la base de datos
export type TipoVehiculo = 'camion' | 'tractomula' | 'volqueta';
export type EstadoVehiculo = 'activo' | 'en_mantenimiento' | 'inactivo';
export type EstadoRemolque = 'activo' | 'en_mantenimiento' | 'inactivo';
export type TipoMantenimiento = 'preventivo' | 'correctivo';
export type PrioridadAlerta = 'alta' | 'media' | 'baja';
export type EstadoAlerta = 'pendiente' | 'atendida' | 'descartada';
export type RolUsuario = 'administrador' | 'operador';
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

export interface Database {
  public: {
    Tables: {
      usuarios: {
        Row: {
          id: string;
          nombre: string;
          email: string;
          rol: RolUsuario;
          avatar_url: string | null;
          activo: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          nombre: string;
          email: string;
          rol?: RolUsuario;
          avatar_url?: string | null;
          activo?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          nombre?: string;
          email?: string;
          rol?: RolUsuario;
          avatar_url?: string | null;
          activo?: boolean;
          updated_at?: string;
        };
      };
      conductores: {
        Row: {
          id: string;
          nombre: string;
          cedula: string | null;
          telefono: string | null;
          direccion: string | null;
          licencia_numero: string | null;
          licencia_categoria: string | null;
          licencia_vencimiento: string | null;
          fecha_ingreso: string | null;
          activo: boolean;
          notas: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          nombre: string;
          cedula?: string | null;
          telefono?: string | null;
          direccion?: string | null;
          licencia_numero?: string | null;
          licencia_categoria?: string | null;
          licencia_vencimiento?: string | null;
          fecha_ingreso?: string | null;
          activo?: boolean;
          notas?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          nombre?: string;
          cedula?: string | null;
          telefono?: string | null;
          direccion?: string | null;
          licencia_numero?: string | null;
          licencia_categoria?: string | null;
          licencia_vencimiento?: string | null;
          fecha_ingreso?: string | null;
          activo?: boolean;
          notas?: string | null;
          updated_at?: string;
        };
      };
      remolques: {
        Row: {
          id: string;
          placa: string;
          tipo: string | null;
          capacidad: string | null;
          año: number | null;
          estado: EstadoRemolque;
          notas: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          placa: string;
          tipo?: string | null;
          capacidad?: string | null;
          año?: number | null;
          estado?: EstadoRemolque;
          notas?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          placa?: string;
          tipo?: string | null;
          capacidad?: string | null;
          año?: number | null;
          estado?: EstadoRemolque;
          notas?: string | null;
          updated_at?: string;
        };
      };
      vehiculos: {
        Row: {
          id: string;
          placa: string;
          marca: string;
          modelo: string;
          año: number;
          tipo: TipoVehiculo;
          kilometraje: number;
          estado: EstadoVehiculo;
          fecha_adquisicion: string;
          proxima_revision: string | null;
          vencimiento_soat: string | null;
          vencimiento_tecnomecanica: string | null;
          color: string | null;
          numero_motor: string | null;
          numero_chasis: string | null;
          imagen_url: string | null;
          notas: string | null;
          conductor_id: string | null;
          remolque_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          placa: string;
          marca: string;
          modelo: string;
          año: number;
          tipo: TipoVehiculo;
          kilometraje?: number;
          estado?: EstadoVehiculo;
          fecha_adquisicion: string;
          proxima_revision?: string | null;
          vencimiento_soat?: string | null;
          vencimiento_tecnomecanica?: string | null;
          color?: string | null;
          numero_motor?: string | null;
          numero_chasis?: string | null;
          imagen_url?: string | null;
          notas?: string | null;
          conductor_id?: string | null;
          remolque_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          placa?: string;
          marca?: string;
          modelo?: string;
          año?: number;
          tipo?: TipoVehiculo;
          kilometraje?: number;
          estado?: EstadoVehiculo;
          fecha_adquisicion?: string;
          proxima_revision?: string | null;
          vencimiento_soat?: string | null;
          vencimiento_tecnomecanica?: string | null;
          color?: string | null;
          numero_motor?: string | null;
          numero_chasis?: string | null;
          imagen_url?: string | null;
          notas?: string | null;
          conductor_id?: string | null;
          remolque_id?: string | null;
          updated_at?: string;
        };
      };
      mantenimientos: {
        Row: {
          id: string;
          vehiculo_id: string;
          tipo: TipoMantenimiento;
          categoria: CategoriaMantenimiento;
          descripcion: string;
          fecha: string;
          kilometraje: number;
          costo: number;
          proveedor: string | null;
          observaciones: string | null;
          proximo_km: number | null;
          proxima_fecha: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          vehiculo_id: string;
          tipo: TipoMantenimiento;
          categoria: CategoriaMantenimiento;
          descripcion: string;
          fecha: string;
          kilometraje: number;
          costo?: number;
          proveedor?: string | null;
          observaciones?: string | null;
          proximo_km?: number | null;
          proxima_fecha?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          vehiculo_id?: string;
          tipo?: TipoMantenimiento;
          categoria?: CategoriaMantenimiento;
          descripcion?: string;
          fecha?: string;
          kilometraje?: number;
          costo?: number;
          proveedor?: string | null;
          observaciones?: string | null;
          proximo_km?: number | null;
          proxima_fecha?: string | null;
          updated_at?: string;
        };
      };
      repuestos: {
        Row: {
          id: string;
          mantenimiento_id: string;
          nombre: string;
          cantidad: number;
          costo_unitario: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          mantenimiento_id: string;
          nombre: string;
          cantidad?: number;
          costo_unitario?: number;
          created_at?: string;
        };
        Update: {
          mantenimiento_id?: string;
          nombre?: string;
          cantidad?: number;
          costo_unitario?: number;
        };
      };
      alertas: {
        Row: {
          id: string;
          vehiculo_id: string;
          tipo: TipoAlerta;
          prioridad: PrioridadAlerta;
          mensaje: string;
          fecha_generada: string;
          estado: EstadoAlerta;
          kilometraje_actual: number | null;
          kilometraje_limite: number | null;
          fecha_limite: string | null;
          atendida_por: string | null;
          atendida_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          vehiculo_id: string;
          tipo: TipoAlerta;
          prioridad: PrioridadAlerta;
          mensaje: string;
          fecha_generada?: string;
          estado?: EstadoAlerta;
          kilometraje_actual?: number | null;
          kilometraje_limite?: number | null;
          fecha_limite?: string | null;
          atendida_por?: string | null;
          atendida_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          tipo?: TipoAlerta;
          prioridad?: PrioridadAlerta;
          mensaje?: string;
          estado?: EstadoAlerta;
          kilometraje_actual?: number | null;
          kilometraje_limite?: number | null;
          fecha_limite?: string | null;
          atendida_por?: string | null;
          atendida_at?: string | null;
          updated_at?: string;
        };
      };
      catalogo_mantenimiento: {
        Row: {
          id: string;
          categoria: CategoriaMantenimiento;
          nombre: string;
          descripcion: string | null;
          intervalo_km: number | null;
          intervalo_meses: number | null;
          tipo: TipoMantenimiento;
          activo: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          categoria: CategoriaMantenimiento;
          nombre: string;
          descripcion?: string | null;
          intervalo_km?: number | null;
          intervalo_meses?: number | null;
          tipo?: TipoMantenimiento;
          activo?: boolean;
          created_at?: string;
        };
        Update: {
          categoria?: CategoriaMantenimiento;
          nombre?: string;
          descripcion?: string | null;
          intervalo_km?: number | null;
          intervalo_meses?: number | null;
          tipo?: TipoMantenimiento;
          activo?: boolean;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      is_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
    };
    Enums: {
      tipo_vehiculo: TipoVehiculo;
      estado_vehiculo: EstadoVehiculo;
      estado_remolque: EstadoRemolque;
      tipo_mantenimiento: TipoMantenimiento;
      prioridad_alerta: PrioridadAlerta;
      estado_alerta: EstadoAlerta;
      categoria_mantenimiento: CategoriaMantenimiento;
      tipo_alerta: TipoAlerta;
      rol_usuario: RolUsuario;
    };
  };
}

// Tipos helper para uso mas facil
export type Vehiculo = Database['public']['Tables']['vehiculos']['Row'];
export type VehiculoInsert = Database['public']['Tables']['vehiculos']['Insert'];
export type VehiculoUpdate = Database['public']['Tables']['vehiculos']['Update'];

export type Conductor = Database['public']['Tables']['conductores']['Row'];
export type ConductorInsert = Database['public']['Tables']['conductores']['Insert'];
export type ConductorUpdate = Database['public']['Tables']['conductores']['Update'];

export type Remolque = Database['public']['Tables']['remolques']['Row'];
export type RemolqueInsert = Database['public']['Tables']['remolques']['Insert'];
export type RemolqueUpdate = Database['public']['Tables']['remolques']['Update'];

export type Mantenimiento = Database['public']['Tables']['mantenimientos']['Row'];
export type MantenimientoInsert = Database['public']['Tables']['mantenimientos']['Insert'];
export type MantenimientoUpdate = Database['public']['Tables']['mantenimientos']['Update'];

export type Alerta = Database['public']['Tables']['alertas']['Row'];
export type AlertaInsert = Database['public']['Tables']['alertas']['Insert'];
export type AlertaUpdate = Database['public']['Tables']['alertas']['Update'];

export type Repuesto = Database['public']['Tables']['repuestos']['Row'];
export type RepuestoInsert = Database['public']['Tables']['repuestos']['Insert'];

export type Usuario = Database['public']['Tables']['usuarios']['Row'];
export type UsuarioInsert = Database['public']['Tables']['usuarios']['Insert'];

export type CatalogoMantenimiento = Database['public']['Tables']['catalogo_mantenimiento']['Row'];

// Tipo para vehiculo con conductor y remolque incluido (join)
export type VehiculoCompleto = Vehiculo & {
  conductores: Pick<Conductor, 'id' | 'nombre' | 'cedula'> | null;
  remolques: Pick<Remolque, 'id' | 'placa'> | null;
};

// Tipo para mantenimiento con vehiculo incluido (join)
export type MantenimientoConVehiculo = Mantenimiento & {
  vehiculos: Pick<Vehiculo, 'placa' | 'marca' | 'modelo'>;
};

// Tipo para alerta con vehiculo incluido (join)
export type AlertaConVehiculo = Alerta & {
  vehiculos: Pick<Vehiculo, 'placa' | 'marca' | 'modelo'>;
};
