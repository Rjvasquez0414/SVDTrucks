'use client';

import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import { mantenimientos } from '@/data/mantenimientos';
import { vehiculos, getVehiculoById } from '@/data/vehiculos';
import { getCategoriaInfo } from '@/data/tipos-mantenimiento';
import { TrendingUp, TrendingDown, DollarSign, Wrench, Truck } from 'lucide-react';

// Datos para gráfico de costos por mes
const costosPorMes = [
  { mes: 'Sep', preventivo: 2800000, correctivo: 1400000 },
  { mes: 'Oct', preventivo: 3200000, correctivo: 980000 },
  { mes: 'Nov', preventivo: 2100000, correctivo: 2600000 },
  { mes: 'Dic', preventivo: 3500000, correctivo: 1200000 },
  { mes: 'Ene', preventivo: 4100000, correctivo: 850000 },
  { mes: 'Feb', preventivo: 2900000, correctivo: 4500000 },
];

// Datos para gráfico de distribución por tipo
const distribucionTipo = [
  { name: 'Preventivo', value: mantenimientos.filter((m) => m.tipo === 'preventivo').length, color: '#3b82f6' },
  { name: 'Correctivo', value: mantenimientos.filter((m) => m.tipo === 'correctivo').length, color: '#f97316' },
];

// Datos para costos por vehículo
const costosPorVehiculo = vehiculos.map((v) => {
  const costoTotal = mantenimientos
    .filter((m) => m.vehiculoId === v.id)
    .reduce((sum, m) => sum + m.costo, 0);
  return {
    placa: v.placa,
    costo: costoTotal,
    mantenimientos: mantenimientos.filter((m) => m.vehiculoId === v.id).length,
  };
}).sort((a, b) => b.costo - a.costo);

// Datos para distribución por categoría
const categorias = mantenimientos.reduce((acc, m) => {
  const info = getCategoriaInfo(m.categoria);
  const nombre = info?.nombre || m.categoria;
  acc[nombre] = (acc[nombre] || 0) + 1;
  return acc;
}, {} as Record<string, number>);

const distribucionCategoria = Object.entries(categorias)
  .map(([name, value]) => ({ name, value }))
  .sort((a, b) => b.value - a.value)
  .slice(0, 6);

const COLORS = ['#3b82f6', '#22c55e', '#f97316', '#eab308', '#8b5cf6', '#ec4899'];

const formatearPesos = (valor: number) => {
  if (valor >= 1000000) {
    return `$${(valor / 1000000).toFixed(1)}M`;
  }
  return `$${(valor / 1000).toFixed(0)}K`;
};

const formatearPesosCompleto = (valor: number) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(valor);
};

export default function ReportesPage() {
  const costoTotalGeneral = mantenimientos.reduce((sum, m) => sum + m.costo, 0);
  const promedioMensual = costoTotalGeneral / 6;
  const totalMantenimientos = mantenimientos.length;

  return (
    <MainLayout title="Reportes y Analisis">
      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                <DollarSign className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Costo Total</p>
                <p className="text-xl font-bold">{formatearPesosCompleto(costoTotalGeneral)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Promedio Mensual</p>
                <p className="text-xl font-bold">{formatearPesosCompleto(promedioMensual)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100">
                <Wrench className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Mantenimientos</p>
                <p className="text-xl font-bold">{totalMantenimientos}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                <Truck className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Vehiculos Activos</p>
                <p className="text-xl font-bold">
                  {vehiculos.filter((v) => v.estado === 'activo').length} / {vehiculos.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="costos" className="mt-6">
        <TabsList>
          <TabsTrigger value="costos">Costos por Mes</TabsTrigger>
          <TabsTrigger value="vehiculos">Por Vehiculo</TabsTrigger>
          <TabsTrigger value="distribucion">Distribucion</TabsTrigger>
        </TabsList>

        <TabsContent value="costos" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Evolucion de Costos Mensuales</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={costosPorMes}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="mes" className="text-xs" />
                    <YAxis tickFormatter={formatearPesos} className="text-xs" />
                    <Tooltip
                      formatter={(value: number) => formatearPesosCompleto(value)}
                      labelStyle={{ color: '#000' }}
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                      }}
                    />
                    <Legend />
                    <Bar dataKey="preventivo" name="Preventivo" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="correctivo" name="Correctivo" fill="#f97316" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vehiculos" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Costos por Vehiculo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={costosPorVehiculo} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" tickFormatter={formatearPesos} className="text-xs" />
                    <YAxis type="category" dataKey="placa" className="text-xs" width={80} />
                    <Tooltip
                      formatter={(value: number) => formatearPesosCompleto(value)}
                      labelStyle={{ color: '#000' }}
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar dataKey="costo" name="Costo Total" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distribucion" className="mt-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Tipo de Mantenimiento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={distribucionTipo}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                      >
                        {distribucionTipo.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 flex justify-center gap-6">
                  {distribucionTipo.map((item) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-sm">
                        {item.name}: {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Por Categoria</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={distribucionCategoria}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        dataKey="value"
                        label={({ name, value }) => `${value}`}
                      >
                        {distribucionCategoria.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {distribucionCategoria.map((item, index) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 shrink-0 rounded-full"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="text-xs truncate">
                        {item.name}: {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Top vehicles table */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Vehiculos con Mayor Costo de Mantenimiento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {costosPorVehiculo.slice(0, 5).map((item, index) => {
              const vehiculo = vehiculos.find((v) => v.placa === item.placa);
              return (
                <div key={item.placa} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-medium">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{item.placa}</p>
                      <p className="text-sm text-muted-foreground">
                        {vehiculo?.marca} {vehiculo?.modelo}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatearPesosCompleto(item.costo)}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.mantenimientos} mantenimiento{item.mantenimientos !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </MainLayout>
  );
}
