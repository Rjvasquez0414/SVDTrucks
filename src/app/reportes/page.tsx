'use client';

import { useState, useEffect, useMemo } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
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
  Legend,
} from 'recharts';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getVehiculos } from '@/lib/queries/vehiculos';
import { getMantenimientos, type MantenimientoConVehiculo } from '@/lib/queries/mantenimientos';
import { getCategoriaInfo } from '@/data/tipos-mantenimiento';
import { DollarSign, Wrench, Truck, Loader2, Calendar, TrendingUp, Download, FileText, FileSpreadsheet, FileIcon } from 'lucide-react';
import type { VehiculoCompleto } from '@/types/database';
import { exportToPDF, exportToExcel, exportToWord, type ReportData } from '@/lib/export-utils';

// Tipos de periodo
type TipoPeriodo = 'anual' | 'semestral' | 'trimestral';

interface PeriodoOption {
  value: string;
  label: string;
  meses: number[];
}

// Generar opciones de periodo segun el tipo
const getPeriodoOptions = (tipo: TipoPeriodo, año: number): PeriodoOption[] => {
  switch (tipo) {
    case 'trimestral':
      return [
        { value: 'Q1', label: `Q1 ${año} (Ene-Mar)`, meses: [0, 1, 2] },
        { value: 'Q2', label: `Q2 ${año} (Abr-Jun)`, meses: [3, 4, 5] },
        { value: 'Q3', label: `Q3 ${año} (Jul-Sep)`, meses: [6, 7, 8] },
        { value: 'Q4', label: `Q4 ${año} (Oct-Dic)`, meses: [9, 10, 11] },
      ];
    case 'semestral':
      return [
        { value: 'S1', label: `S1 ${año} (Ene-Jun)`, meses: [0, 1, 2, 3, 4, 5] },
        { value: 'S2', label: `S2 ${año} (Jul-Dic)`, meses: [6, 7, 8, 9, 10, 11] },
      ];
    case 'anual':
    default:
      return [
        { value: 'anual', label: `Año ${año}`, meses: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] },
      ];
  }
};

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

// Generar lista de años disponibles (desde 2020 hasta el año actual)
const generarAñosDisponibles = () => {
  const añoActual = new Date().getFullYear();
  const años: number[] = [];
  for (let año = añoActual; año >= 2020; año--) {
    años.push(año);
  }
  return años;
};

const añosDisponibles = generarAñosDisponibles();

export default function ReportesPage() {
  const [mantenimientos, setMantenimientos] = useState<MantenimientoConVehiculo[]>([]);
  const [vehiculos, setVehiculos] = useState<VehiculoCompleto[]>([]);
  const [loading, setLoading] = useState(true);
  const [añoSeleccionado, setAñoSeleccionado] = useState(new Date().getFullYear());
  const [tipoPeriodo, setTipoPeriodo] = useState<TipoPeriodo>('anual');
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState('anual');
  const [vehiculosComparar, setVehiculosComparar] = useState<string[]>([]);
  const [exporting, setExporting] = useState<'pdf' | 'excel' | 'word' | null>(null);

  // Obtener opciones de periodo segun el tipo seleccionado
  const periodoOptions = useMemo(() =>
    getPeriodoOptions(tipoPeriodo, añoSeleccionado),
    [tipoPeriodo, añoSeleccionado]
  );

  // Obtener meses del periodo seleccionado
  const mesesPeriodo = useMemo(() => {
    const periodo = periodoOptions.find(p => p.value === periodoSeleccionado);
    return periodo?.meses || [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  }, [periodoOptions, periodoSeleccionado]);

  // Resetear periodo cuando cambia el tipo
  useEffect(() => {
    const defaultPeriodo = tipoPeriodo === 'anual' ? 'anual' : tipoPeriodo === 'semestral' ? 'S1' : 'Q1';
    setPeriodoSeleccionado(defaultPeriodo);
  }, [tipoPeriodo]);

  // Calcular costos por mes usando useMemo (se recalcula cuando cambian mantenimientos o año)
  const costosPorMes = useMemo(() => {
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return meses.map((mesNombre, index) => {
      const mantsMes = mantenimientos.filter(m => {
        const fecha = new Date(m.fecha);
        return fecha.getFullYear() === añoSeleccionado && fecha.getMonth() === index;
      });
      return {
        mes: mesNombre,
        preventivo: mantsMes.filter(m => m.tipo === 'preventivo').reduce((sum, m) => sum + (m.costo || 0), 0),
        correctivo: mantsMes.filter(m => m.tipo === 'correctivo').reduce((sum, m) => sum + (m.costo || 0), 0),
      };
    });
  }, [mantenimientos, añoSeleccionado]);

  // Cargar datos iniciales
  useEffect(() => {
    async function loadData() {
      const [mantsData, vehsData] = await Promise.all([
        getMantenimientos(),
        getVehiculos(),
      ]);
      setMantenimientos(mantsData);
      setVehiculos(vehsData);
      setLoading(false);
    }
    loadData();
  }, []);

  // Filtrar mantenimientos del periodo seleccionado
  const mantenimientosPeriodo = useMemo(() => {
    return mantenimientos.filter(m => {
      const fecha = new Date(m.fecha);
      return fecha.getFullYear() === añoSeleccionado && mesesPeriodo.includes(fecha.getMonth());
    });
  }, [mantenimientos, añoSeleccionado, mesesPeriodo]);

  // Alias para compatibilidad (renombrado de mantenimientosAño a mantenimientosPeriodo)
  const mantenimientosAño = mantenimientosPeriodo;

  // Calcular estadísticas del año seleccionado
  const costoTotalGeneral = mantenimientosAño.reduce((sum, m) => sum + (m.costo || 0), 0);
  const totalMantenimientos = mantenimientosAño.length;
  const mesesConDatos = costosPorMes.filter(c => c.preventivo > 0 || c.correctivo > 0).length;
  const promedioMensual = mesesConDatos > 0 ? costoTotalGeneral / mesesConDatos : 0;

  // Distribución por tipo (del año seleccionado)
  const distribucionTipo = [
    { name: 'Preventivo', value: mantenimientosAño.filter((m) => m.tipo === 'preventivo').length, color: '#3b82f6' },
    { name: 'Correctivo', value: mantenimientosAño.filter((m) => m.tipo === 'correctivo').length, color: '#f97316' },
  ];

  // Costos por vehículo (del año seleccionado)
  const costosPorVehiculo = vehiculos.map((v) => {
    const costoTotal = mantenimientosAño
      .filter((m) => m.vehiculo_id === v.id)
      .reduce((sum, m) => sum + (m.costo || 0), 0);
    return {
      placa: v.placa,
      marca: v.marca,
      modelo: v.modelo,
      costo: costoTotal,
      mantenimientos: mantenimientosAño.filter((m) => m.vehiculo_id === v.id).length,
    };
  }).sort((a, b) => b.costo - a.costo);

  // Distribución por categoría (del año seleccionado)
  const categorias = mantenimientosAño.reduce((acc, m) => {
    const info = getCategoriaInfo(m.categoria);
    const nombre = info?.nombre || m.categoria;
    acc[nombre] = (acc[nombre] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const distribucionCategoria = Object.entries(categorias)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  // Obtener etiqueta del periodo actual
  const getPeriodoLabel = () => {
    if (tipoPeriodo === 'anual') return `Año ${añoSeleccionado}`;
    const option = periodoOptions.find(p => p.value === periodoSeleccionado);
    return option?.label || `${añoSeleccionado}`;
  };

  // Preparar datos para exportacion
  const prepareExportData = (): ReportData => ({
    titulo: 'Reporte de Mantenimientos',
    periodo: getPeriodoLabel(),
    fechaGeneracion: new Date().toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
    vehiculos: costosPorVehiculo,
    costoTotal: costoTotalGeneral,
    totalMantenimientos,
    costosPorMes,
    promedioMensual,
  });

  // Funciones de exportacion
  const handleExport = async (format: 'pdf' | 'excel' | 'word') => {
    setExporting(format);
    try {
      const data = prepareExportData();
      switch (format) {
        case 'pdf':
          await exportToPDF(data);
          break;
        case 'excel':
          await exportToExcel(data);
          break;
        case 'word':
          await exportToWord(data);
          break;
      }
    } catch (error) {
      console.error('Error al exportar:', error);
    } finally {
      setExporting(null);
    }
  };

  if (loading) {
    return (
      <MainLayout title="Reportes y Analisis">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Reportes y Analisis">
      {/* Selectores de periodo */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span className="text-sm">Filtrar por periodo:</span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* Tipo de periodo */}
          <Select
            value={tipoPeriodo}
            onValueChange={(value) => setTipoPeriodo(value as TipoPeriodo)}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="trimestral">Trimestral</SelectItem>
              <SelectItem value="semestral">Semestral</SelectItem>
              <SelectItem value="anual">Anual</SelectItem>
            </SelectContent>
          </Select>

          {/* Año */}
          <Select
            value={añoSeleccionado.toString()}
            onValueChange={(value) => setAñoSeleccionado(parseInt(value))}
          >
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {añosDisponibles.map((año) => (
                <SelectItem key={año} value={año.toString()}>
                  {año}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Periodo especifico (solo si no es anual) */}
          {tipoPeriodo !== 'anual' && (
            <Select
              value={periodoSeleccionado}
              onValueChange={setPeriodoSeleccionado}
            >
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {periodoOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Botones de exportacion */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <span className="text-sm text-muted-foreground mr-2">
          <Download className="h-4 w-4 inline mr-1" />
          Exportar:
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleExport('pdf')}
          disabled={exporting !== null}
        >
          {exporting === 'pdf' ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <FileText className="h-4 w-4 mr-2 text-red-500" />
          )}
          PDF
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleExport('excel')}
          disabled={exporting !== null}
        >
          {exporting === 'excel' ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <FileSpreadsheet className="h-4 w-4 mr-2 text-green-600" />
          )}
          Excel
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleExport('word')}
          disabled={exporting !== null}
        >
          {exporting === 'word' ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <FileIcon className="h-4 w-4 mr-2 text-blue-600" />
          )}
          Word
        </Button>
      </div>

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
                <DollarSign className="h-5 w-5 text-green-600" />
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
          <TabsTrigger value="comparacion" className="flex items-center gap-1">
            <TrendingUp className="h-4 w-4" />
            Comparar
          </TabsTrigger>
        </TabsList>

        <TabsContent value="costos" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Evolucion de Costos Mensuales ({añoSeleccionado})</CardTitle>
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
                {costosPorVehiculo.length > 0 ? (
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
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    No hay datos de costos por vehiculo
                  </div>
                )}
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
                  {totalMantenimientos > 0 ? (
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
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      No hay mantenimientos registrados
                    </div>
                  )}
                </div>
                {totalMantenimientos > 0 && (
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
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Por Categoria</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  {distribucionCategoria.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={distribucionCategoria}
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          dataKey="value"
                          label={({ value }) => `${value}`}
                        >
                          {distribucionCategoria.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      No hay mantenimientos registrados
                    </div>
                  )}
                </div>
                {distribucionCategoria.length > 0 && (
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
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab de comparacion de vehiculos */}
        <TabsContent value="comparacion" className="mt-4">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Selector de vehiculos */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Seleccionar Vehiculos</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Selecciona los vehiculos que deseas comparar
                </p>
                <div className="space-y-3 max-h-[300px] overflow-y-auto">
                  {vehiculos.map((v) => (
                    <div key={v.id} className="flex items-center gap-3">
                      <Checkbox
                        id={`compare-${v.id}`}
                        checked={vehiculosComparar.includes(v.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setVehiculosComparar([...vehiculosComparar, v.id]);
                          } else {
                            setVehiculosComparar(vehiculosComparar.filter(id => id !== v.id));
                          }
                        }}
                      />
                      <Label
                        htmlFor={`compare-${v.id}`}
                        className="flex-1 cursor-pointer"
                      >
                        <span className="font-medium">{v.placa}</span>
                        <span className="text-sm text-muted-foreground ml-2">
                          {v.marca} {v.modelo}
                        </span>
                      </Label>
                    </div>
                  ))}
                </div>
                {vehiculosComparar.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4 w-full"
                    onClick={() => setVehiculosComparar([])}
                  >
                    Limpiar seleccion
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Grafico comparativo */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">
                  Comparacion de Costos
                  {vehiculosComparar.length > 0 && ` (${vehiculosComparar.length} vehiculos)`}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {vehiculosComparar.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
                    <TrendingUp className="h-12 w-12 mb-4 opacity-50" />
                    <p>Selecciona al menos un vehiculo para comparar</p>
                  </div>
                ) : (
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={vehiculosComparar.map(id => {
                          const vehiculo = vehiculos.find(v => v.id === id);
                          const costoTotal = mantenimientosPeriodo
                            .filter(m => m.vehiculo_id === id)
                            .reduce((sum, m) => sum + (m.costo || 0), 0);
                          const preventivo = mantenimientosPeriodo
                            .filter(m => m.vehiculo_id === id && m.tipo === 'preventivo')
                            .reduce((sum, m) => sum + (m.costo || 0), 0);
                          const correctivo = mantenimientosPeriodo
                            .filter(m => m.vehiculo_id === id && m.tipo === 'correctivo')
                            .reduce((sum, m) => sum + (m.costo || 0), 0);
                          return {
                            placa: vehiculo?.placa || id,
                            total: costoTotal,
                            preventivo,
                            correctivo,
                          };
                        })}
                      >
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="placa" className="text-xs" />
                        <YAxis tickFormatter={formatearPesos} className="text-xs" />
                        <Tooltip
                          formatter={(value: number) => formatearPesosCompleto(value)}
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
                )}
              </CardContent>
            </Card>
          </div>

          {/* Tabla comparativa */}
          {vehiculosComparar.length > 0 && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-base">Detalle Comparativo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-2 font-medium">Vehiculo</th>
                        <th className="text-right py-3 px-2 font-medium">Preventivo</th>
                        <th className="text-right py-3 px-2 font-medium">Correctivo</th>
                        <th className="text-right py-3 px-2 font-medium">Total</th>
                        <th className="text-right py-3 px-2 font-medium"># Mant.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vehiculosComparar.map(id => {
                        const vehiculo = vehiculos.find(v => v.id === id);
                        const mantsVehiculo = mantenimientosPeriodo.filter(m => m.vehiculo_id === id);
                        const preventivo = mantsVehiculo
                          .filter(m => m.tipo === 'preventivo')
                          .reduce((sum, m) => sum + (m.costo || 0), 0);
                        const correctivo = mantsVehiculo
                          .filter(m => m.tipo === 'correctivo')
                          .reduce((sum, m) => sum + (m.costo || 0), 0);
                        const total = preventivo + correctivo;
                        return (
                          <tr key={id} className="border-b last:border-0 hover:bg-muted/50">
                            <td className="py-3 px-2">
                              <div>
                                <span className="font-medium">{vehiculo?.placa}</span>
                                <p className="text-xs text-muted-foreground">
                                  {vehiculo?.marca} {vehiculo?.modelo}
                                </p>
                              </div>
                            </td>
                            <td className="text-right py-3 px-2 text-blue-600">
                              {formatearPesosCompleto(preventivo)}
                            </td>
                            <td className="text-right py-3 px-2 text-orange-600">
                              {formatearPesosCompleto(correctivo)}
                            </td>
                            <td className="text-right py-3 px-2 font-medium">
                              {formatearPesosCompleto(total)}
                            </td>
                            <td className="text-right py-3 px-2">
                              {mantsVehiculo.length}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Top vehicles table */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Vehiculos con Mayor Costo de Mantenimiento</CardTitle>
        </CardHeader>
        <CardContent>
          {costosPorVehiculo.filter(v => v.costo > 0).length > 0 ? (
            <div className="space-y-4">
              {costosPorVehiculo.filter(v => v.costo > 0).slice(0, 5).map((item, index) => (
                <div key={item.placa} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-medium">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{item.placa}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.marca} {item.modelo}
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
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No hay mantenimientos registrados aun
            </div>
          )}
        </CardContent>
      </Card>
    </MainLayout>
  );
}
