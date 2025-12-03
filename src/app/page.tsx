import { MainLayout } from '@/components/layout/MainLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { AlertasRecientes } from '@/components/dashboard/AlertasRecientes';
import { ProximosMantenimientos } from '@/components/dashboard/ProximosMantenimientos';
import { FlotaResumen } from '@/components/dashboard/FlotaResumen';
import { vehiculos } from '@/data/vehiculos';
import { getAlertasPendientes } from '@/data/alertas';
import { getCostoTotalMes, getMantenimientosMes } from '@/data/mantenimientos';
import { Truck, AlertTriangle, Wrench, DollarSign } from 'lucide-react';

export default function DashboardPage() {
  // Estadísticas
  const totalVehiculos = vehiculos.length;
  const vehiculosActivos = vehiculos.filter((v) => v.estado === 'activo').length;
  const vehiculosMantenimiento = vehiculos.filter((v) => v.estado === 'en_mantenimiento').length;
  const alertasPendientes = getAlertasPendientes().length;

  // Costos del mes actual y anterior (usando febrero 2024 como referencia)
  const costoMesActual = getCostoTotalMes(2024, 1); // Febrero
  const costoMesAnterior = getCostoTotalMes(2024, 0); // Enero
  const mantenimientosMes = getMantenimientosMes(2024, 1).length;

  // Calcular tendencia
  const tendenciaCosto = costoMesAnterior > 0
    ? ((costoMesActual - costoMesAnterior) / costoMesAnterior) * 100
    : 0;

  // Formatear costo
  const formatearPesos = (valor: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(valor);
  };

  return (
    <MainLayout title="Dashboard">
      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Vehiculos"
          value={totalVehiculos}
          subtitle={`${vehiculosActivos} activos`}
          icon={Truck}
          variant="default"
        />
        <StatCard
          title="En Mantenimiento"
          value={vehiculosMantenimiento}
          subtitle="Vehiculos en taller"
          icon={Wrench}
          variant={vehiculosMantenimiento > 0 ? 'warning' : 'success'}
        />
        <StatCard
          title="Alertas Pendientes"
          value={alertasPendientes}
          subtitle="Requieren atencion"
          icon={AlertTriangle}
          variant={alertasPendientes > 5 ? 'danger' : alertasPendientes > 0 ? 'warning' : 'success'}
        />
        <StatCard
          title="Gastos del Mes"
          value={formatearPesos(costoMesActual)}
          subtitle={`${mantenimientosMes} mantenimientos`}
          icon={DollarSign}
          trend={{
            value: Math.abs(Math.round(tendenciaCosto)),
            isPositive: tendenciaCosto < 0,
          }}
          variant="default"
        />
      </div>

      {/* Main Content Grid */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <AlertasRecientes />
        <ProximosMantenimientos />
      </div>

      {/* Fleet Overview */}
      <div className="mt-6">
        <FlotaResumen />
      </div>
    </MainLayout>
  );
}
