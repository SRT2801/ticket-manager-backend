import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import PDFDocument from 'pdfkit';

interface DashboardStats {
  total: number;
  open: number;
  inProgress: number;
  closed: number;
  resolutionRate: number;
  recent: {
    title: string;
    priority: string;
    status: string;
    createdAt: string;
  }[];
}

function priorityLabel(priority: string): string {
  const map: Record<string, string> = { LOW: 'Baja', MEDIUM: 'Media', HIGH: 'Alta' };
  return map[priority] || priority;
}

function statusLabel(status: string): string {
  const map: Record<string, string> = { OPEN: 'Abierto', IN_PROGRESS: 'En Progreso', CLOSED: 'Cerrado' };
  return map[status] || status;
}

function priorityColor(priority: string): string {
  const map: Record<string, string> = { LOW: '#10B981', MEDIUM: '#F59E0B', HIGH: '#F43F5E' };
  return map[priority] || '#908fa0';
}

function statusColor(status: string): string {
  const map: Record<string, string> = { OPEN: '#F59E0B', IN_PROGRESS: '#6366f1', CLOSED: '#10B981' };
  return map[status] || '#908fa0';
}

function generateDashboardPdf(stats: DashboardStats, date: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const doc = new PDFDocument({
      size: 'A4',
      margin: 40,
      bufferPages: true,
    });

    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const pageWidth = doc.page.width;
    const contentWidth = pageWidth - 80;
    const col1 = 40;
    const col2 = pageWidth / 2;

    // Header gradient bar
    doc.rect(0, 0, pageWidth, 90).fill('#6366f1');
    doc.rect(0, 90, pageWidth, 4).fill('#c0c1ff');

    doc.font('Helvetica-Bold').fontSize(22).fillColor('#1000a9').text('Ticket Manager', 40, 22);
    doc.font('Helvetica').fontSize(11).fillColor('#0d0096').text(`Reporte del Dashboard  •  ${date}`, 40, 48);

    let y = 120;

    // KPI cards
    const kpiData = [
      { label: 'Total', value: stats.total, bg: '#6366f111', border: '#6366f122', text: '#c0c1ff' },
      { label: 'Abiertos', value: stats.open, bg: '#F59E0B11', border: '#F59E0B22', text: '#F59E0B' },
      { label: 'En Progreso', value: stats.inProgress, bg: '#6366f111', border: '#6366f122', text: '#6366f1' },
      { label: 'Cerrados', value: stats.closed, bg: '#10B98111', border: '#10B98122', text: '#10B981' },
    ];

    const kpiWidth = (contentWidth - 36) / 4;
    kpiData.forEach((kpi, i) => {
      const x = 40 + i * (kpiWidth + 12);
      doc.roundedRect(x, y, kpiWidth, 70, 8).fill(kpi.bg);
      doc.roundedRect(x, y, kpiWidth, 70, 8).stroke(kpi.border);
      doc.font('Helvetica').fontSize(9).fillColor('#908fa0').text(kpi.label.toUpperCase(), x, y + 12, { width: kpiWidth, align: 'center' });
      doc.font('Helvetica-Bold').fontSize(26).fillColor(kpi.text).text(String(kpi.value), x, y + 26, { width: kpiWidth, align: 'center' });
    });

    y += 90;

    // Resolution rate
    doc.roundedRect(40, y, contentWidth, 36, 8).fill('#10B98111');
    doc.roundedRect(40, y, contentWidth, 36, 8).stroke('#10B98122');
    doc.font('Helvetica-Bold').fontSize(12).fillColor('#10B981')
      .text(`Tasa de Resolucion: ${stats.resolutionRate}%`, 40, y + 10, { width: contentWidth, align: 'center' });

    y += 56;

    // Recent tickets title
    doc.font('Helvetica-Bold').fontSize(16).fillColor('#e4e1ed').text('Tickets Recientes', 40, y);
    y += 30;

    // Table header
    const thY = y;
    doc.rect(40, y, contentWidth, 28).fill('#0f172a');
    doc.font('Helvetica-Bold').fontSize(9).fillColor('#908fa0');
    doc.text('TICKET', 52, y + 8);
    doc.text('PRIORIDAD', col2 - 30, y + 8);
    doc.text('ESTADO', col2 + 70, y + 8);
    doc.text('CREADO', pageWidth - 40, y + 8, { width: 120, align: 'right' });

    y += 32;

    // Table rows
    if (stats.recent.length === 0) {
      doc.font('Helvetica').fontSize(11).fillColor('#64748b').text('No hay tickets recientes', 40, y + 20, { width: contentWidth, align: 'center' });
    } else {
      stats.recent.forEach((ticket, i) => {
        const rowY = y;
        if (y > doc.page.height - 100) {
          doc.addPage();
          y = 40;
        }

        if (i % 2 === 1) {
          doc.rect(40, y, contentWidth, 32).fill('#1e293b44');
        }

        // Title
        const titleText = ticket.title.length > 45 ? ticket.title.substring(0, 42) + '...' : ticket.title;
        doc.font('Helvetica').fontSize(10).fillColor('#e4e1ed').text(titleText, 52, y + 8);

        // Priority pill
        const pColor = priorityColor(ticket.priority);
        const pLabel = priorityLabel(ticket.priority);
        const pWidth = doc.widthOfString(pLabel) + 20;
        doc.roundedRect(col2 - 30, y + 6, pWidth, 20, 10).fill(`${pColor}22`);
        doc.font('Helvetica-Bold').fontSize(8).fillColor(pColor).text(pLabel.toUpperCase(), col2 - 30 + pWidth / 2, y + 11, { width: 100, align: 'center' });

        // Status pill
        const sColor = statusColor(ticket.status);
        const sLabel = statusLabel(ticket.status);
        const sWidth = doc.widthOfString(sLabel) + 20;
        doc.roundedRect(col2 + 70, y + 6, sWidth, 20, 10).fill(`${sColor}22`);
        doc.font('Helvetica-Bold').fontSize(8).fillColor(sColor).text(sLabel.toUpperCase(), col2 + 70 + sWidth / 2, y + 11, { width: 100, align: 'center' });

        // Created date
        doc.font('Helvetica').fontSize(9).fillColor('#c7c4d7').text(ticket.createdAt, pageWidth - 40, y + 8, { width: 120, align: 'right' });

        y += 32;
      });
    }

    // Footer
    const pageBottom = doc.page.height - 40;
    doc.strokeColor('#334155').lineWidth(1).moveTo(40, pageBottom - 10).lineTo(pageWidth - 40, pageBottom - 10).stroke();
    doc.font('Helvetica').fontSize(9).fillColor('#64748b').text('Ticket Manager • Reporte generado automaticamente', 40, pageBottom + 2, { width: contentWidth, align: 'center' });

    doc.end();
  });
}

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.MAIL_PORT || '587', 10),
      secure: false,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });
  }

  async sendDashboardReport(
    email: string,
    stats: DashboardStats,
    date: string,
  ): Promise<void> {
    const pdfBuffer = await generateDashboardPdf(stats, date);

    await this.transporter.sendMail({
      from: process.env.MAIL_FROM || 'noreply@ticket-manager.com',
      to: email,
      subject: `Ticket Manager — Reporte ${date}`,
      text: 'Adjunto encontraras el reporte del dashboard de Ticket Manager.',
      attachments: [
        {
          filename: `dashboard-report-${new Date().toISOString().split('T')[0]}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    });
  }
}
