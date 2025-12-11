'use client';

import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { FlotaResumen } from '@/components/dashboard/FlotaResumen';
import { getEstadisticasFlota, getVehiculos } from '@/lib/queries/vehiculos';
import { Truck, AlertTriangle, Wrench, DollarSign, Loader2 } from 'lucide-react';
import { VehiculoCompleto } from '@/types/database';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [vehiculos, setVehiculos] = useState<VehiculoCompleto[]>([]);
  const [estadisticas, setEstadisticas] = useState({
    total: 0,
    activos: 0,
    enMantenimiento: 0,
    inactivos: 0,
  });

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const [stats, vehiculosData] = await Promise.all([
        getEstadisticasFlota(),
        getVehiculos(),
      ]);
      setEstadisticas(stats);
      setVehiculos(vehiculosData);
      setLoading(false);
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <MainLayout title="Dashboard">
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="mt-4 text-sm text-muted-foreground">Cargando dashboard...</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Dashboard">
      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Vehiculos"
          value={estadisticas.total}
          subtitle={`${estadisticas.activos} activos`}
          icon={Truck}
          variant="default"
        />
        <StatCard
          title="En Mantenimiento"
          value={estadisticas.enMantenimiento}
          subtitle="Vehiculos en taller"
          icon={Wrench}
          variant={estadisticas.enMantenimiento > 0 ? 'warning' : 'success'}
        />
        <StatCard
          title="Inactivos"
          value={estadisticas.inactivos}
          subtitle="Vehiculos fuera de servicio"
          icon={AlertTriangle}
          variant={estadisticas.inactivos > 0 ? 'danger' : 'success'}
        />
        <StatCard
          title="Gastos del Mes"
          value="$ 0"
          subtitle="Sin registros aun"
          icon={DollarSign}
          variant="default"
        />
      </div>

      {/* Fleet Overview */}
      <div className="mt-6">
        <FlotaResumen vehiculos={vehiculos} />
      </div>

      {/* Placeholder sections */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Alertas Recientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <AlertTriangle className="h-10 w-10 text-muted-foreground/30" />
              <p className="mt-2 text-sm text-muted-foreground">
                No hay alertas registradas
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Proximos Mantenimientos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Wrench className="h-10 w-10 text-muted-foreground/30" />
              <p className="mt-2 text-sm text-muted-foreground">
                No hay mantenimientos programados
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
