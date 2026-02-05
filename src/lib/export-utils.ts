import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Document, Packer, Paragraph, Table, TableCell, TableRow, TextRun, WidthType, AlignmentType, HeadingLevel } from 'docx';
import { saveAs } from 'file-saver';

// Tipos para los datos del reporte
export interface VehiculoCosto {
  placa: string;
  marca: string;
  modelo: string;
  costo: number;
  mantenimientos: number;
}

export interface CostoMensual {
  mes: string;
  preventivo: number;
  correctivo: number;
}

export interface ReportData {
  titulo: string;
  periodo: string;
  fechaGeneracion: string;
  vehiculos: VehiculoCosto[];
  costoTotal: number;
  totalMantenimientos: number;
  costosPorMes: CostoMensual[];
  promedioMensual: number;
}

// Formatear pesos colombianos
const formatearPesos = (valor: number): string => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(valor);
};

// =============================================
// EXPORTAR A PDF
// =============================================
export async function exportToPDF(data: ReportData): Promise<void> {
  const doc = new jsPDF();

  // Titulo
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('SVD Trucks - Reporte de Mantenimientos', 14, 20);

  // Subtitulo con periodo
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Periodo: ${data.periodo}`, 14, 30);
  doc.text(`Generado: ${data.fechaGeneracion}`, 14, 37);

  // Resumen
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Resumen General', 14, 50);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Costo Total: ${formatearPesos(data.costoTotal)}`, 14, 58);
  doc.text(`Total Mantenimientos: ${data.totalMantenimientos}`, 14, 65);
  doc.text(`Promedio Mensual: ${formatearPesos(data.promedioMensual)}`, 14, 72);

  // Tabla de costos por vehiculo
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Costos por Vehiculo', 14, 85);

  const vehiculosData = data.vehiculos
    .filter(v => v.costo > 0)
    .map(v => [
      v.placa,
      `${v.marca} ${v.modelo}`,
      formatearPesos(v.costo),
      v.mantenimientos.toString(),
    ]);

  autoTable(doc, {
    startY: 90,
    head: [['Placa', 'Vehiculo', 'Costo Total', '# Mant.']],
    body: vehiculosData,
    theme: 'striped',
    headStyles: { fillColor: [59, 130, 246] },
    styles: { fontSize: 10 },
  });

  // Tabla de costos por mes
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const finalY = (doc as any).lastAutoTable?.finalY || 150;

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Costos Mensuales', 14, finalY + 15);

  const costosMesData = data.costosPorMes
    .filter(c => c.preventivo > 0 || c.correctivo > 0)
    .map(c => [
      c.mes,
      formatearPesos(c.preventivo),
      formatearPesos(c.correctivo),
      formatearPesos(c.preventivo + c.correctivo),
    ]);

  if (costosMesData.length > 0) {
    autoTable(doc, {
      startY: finalY + 20,
      head: [['Mes', 'Preventivo', 'Correctivo', 'Total']],
      body: costosMesData,
      theme: 'striped',
      headStyles: { fillColor: [34, 197, 94] },
      styles: { fontSize: 10 },
    });
  }

  // Guardar PDF
  doc.save(`reporte-mantenimientos-${data.periodo.replace(/\s/g, '-')}.pdf`);
}

// =============================================
// EXPORTAR A EXCEL
// =============================================
export async function exportToExcel(data: ReportData): Promise<void> {
  const workbook = XLSX.utils.book_new();

  // Hoja de resumen
  const resumenData = [
    ['SVD Trucks - Reporte de Mantenimientos'],
    [''],
    ['Periodo:', data.periodo],
    ['Fecha de Generacion:', data.fechaGeneracion],
    [''],
    ['RESUMEN GENERAL'],
    ['Costo Total:', data.costoTotal],
    ['Total Mantenimientos:', data.totalMantenimientos],
    ['Promedio Mensual:', data.promedioMensual],
  ];

  const wsResumen = XLSX.utils.aoa_to_sheet(resumenData);

  // Formatear columna B como moneda
  wsResumen['B7'] = { t: 'n', v: data.costoTotal, z: '"$"#,##0' };
  wsResumen['B9'] = { t: 'n', v: data.promedioMensual, z: '"$"#,##0' };

  XLSX.utils.book_append_sheet(workbook, wsResumen, 'Resumen');

  // Hoja de vehiculos
  const vehiculosHeader = ['Placa', 'Marca', 'Modelo', 'Costo Total', '# Mantenimientos'];
  const vehiculosRows = data.vehiculos
    .filter(v => v.costo > 0)
    .map(v => [v.placa, v.marca, v.modelo, v.costo, v.mantenimientos]);

  const wsVehiculos = XLSX.utils.aoa_to_sheet([vehiculosHeader, ...vehiculosRows]);
  XLSX.utils.book_append_sheet(workbook, wsVehiculos, 'Por Vehiculo');

  // Hoja de costos mensuales
  const mesesHeader = ['Mes', 'Preventivo', 'Correctivo', 'Total'];
  const mesesRows = data.costosPorMes.map(c => [
    c.mes,
    c.preventivo,
    c.correctivo,
    c.preventivo + c.correctivo,
  ]);

  const wsMeses = XLSX.utils.aoa_to_sheet([mesesHeader, ...mesesRows]);
  XLSX.utils.book_append_sheet(workbook, wsMeses, 'Por Mes');

  // Guardar Excel
  XLSX.writeFile(workbook, `reporte-mantenimientos-${data.periodo.replace(/\s/g, '-')}.xlsx`);
}

// =============================================
// EXPORTAR A WORD
// =============================================
export async function exportToWord(data: ReportData): Promise<void> {
  // Crear tabla de vehiculos
  const vehiculosRows = data.vehiculos
    .filter(v => v.costo > 0)
    .map(v => new TableRow({
      children: [
        new TableCell({
          children: [new Paragraph({ children: [new TextRun(v.placa)] })],
          width: { size: 20, type: WidthType.PERCENTAGE },
        }),
        new TableCell({
          children: [new Paragraph({ children: [new TextRun(`${v.marca} ${v.modelo}`)] })],
          width: { size: 35, type: WidthType.PERCENTAGE },
        }),
        new TableCell({
          children: [new Paragraph({
            children: [new TextRun(formatearPesos(v.costo))],
            alignment: AlignmentType.RIGHT,
          })],
          width: { size: 25, type: WidthType.PERCENTAGE },
        }),
        new TableCell({
          children: [new Paragraph({
            children: [new TextRun(v.mantenimientos.toString())],
            alignment: AlignmentType.CENTER,
          })],
          width: { size: 20, type: WidthType.PERCENTAGE },
        }),
      ],
    }));

  // Header de tabla vehiculos
  const vehiculosHeader = new TableRow({
    children: [
      new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text: 'Placa', bold: true })] })],
        shading: { fill: '3B82F6' },
      }),
      new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text: 'Vehiculo', bold: true })] })],
        shading: { fill: '3B82F6' },
      }),
      new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text: 'Costo Total', bold: true })] })],
        shading: { fill: '3B82F6' },
      }),
      new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text: '# Mant.', bold: true })] })],
        shading: { fill: '3B82F6' },
      }),
    ],
  });

  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        // Titulo
        new Paragraph({
          children: [new TextRun({ text: 'SVD Trucks', bold: true, size: 36 })],
          heading: HeadingLevel.HEADING_1,
        }),
        new Paragraph({
          children: [new TextRun({ text: 'Reporte de Mantenimientos', size: 28 })],
        }),
        new Paragraph({ children: [] }),

        // Info del periodo
        new Paragraph({
          children: [new TextRun({ text: `Periodo: ${data.periodo}`, size: 24 })],
        }),
        new Paragraph({
          children: [new TextRun({ text: `Fecha de generacion: ${data.fechaGeneracion}`, size: 22, italics: true })],
        }),
        new Paragraph({ children: [] }),

        // Resumen
        new Paragraph({
          children: [new TextRun({ text: 'Resumen General', bold: true, size: 28 })],
          heading: HeadingLevel.HEADING_2,
        }),
        new Paragraph({
          children: [new TextRun({ text: `Costo Total: ${formatearPesos(data.costoTotal)}`, size: 24 })],
        }),
        new Paragraph({
          children: [new TextRun({ text: `Total Mantenimientos: ${data.totalMantenimientos}`, size: 24 })],
        }),
        new Paragraph({
          children: [new TextRun({ text: `Promedio Mensual: ${formatearPesos(data.promedioMensual)}`, size: 24 })],
        }),
        new Paragraph({ children: [] }),

        // Tabla de vehiculos
        new Paragraph({
          children: [new TextRun({ text: 'Costos por Vehiculo', bold: true, size: 28 })],
          heading: HeadingLevel.HEADING_2,
        }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [vehiculosHeader, ...vehiculosRows],
        }),
      ],
    }],
  });

  // Generar y descargar
  const blob = await Packer.toBlob(doc);
  saveAs(blob, `reporte-mantenimientos-${data.periodo.replace(/\s/g, '-')}.docx`);
}
