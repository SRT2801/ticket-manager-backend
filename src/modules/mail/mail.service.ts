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
      margin: 50,
      bufferPages: true,
    });

    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const pageWidth = doc.page.width;
    const contentWidth = pageWidth - 100;
    const margin = 50;

    // ── Header ──
    doc.font('Helvetica-Bold').fontSize(18).fillColor('#1e293b')
      .text('Ticket Manager', margin, 40, { width: contentWidth, align: 'center' });
    doc.font('Helvetica').fontSize(11).fillColor('#64748b')
      .text(`Reporte del Dashboard  •  ${date}`, margin, 64, { width: contentWidth, align: 'center' });

    // Thin divider
    doc.strokeColor('#e2e8f0').lineWidth(1)
      .moveTo(margin, 90).lineTo(pageWidth - margin, 90).stroke();

    let y = 115;

    // ── KPIs Row ──
    const kpiData = [
      { label: 'Total', value: stats.total, color: '#6366f1' },
      { label: 'Abiertos', value: stats.open, color: '#F59E0B' },
      { label: 'En Progreso', value: stats.inProgress, color: '#6366f1' },
      { label: 'Cerrados', value: stats.closed, color: '#10B981' },
    ];

    const kpiSpacing = contentWidth / 4;
    kpiData.forEach((kpi, i) => {
      const x = margin + i * kpiSpacing;
      doc.font('Helvetica-Bold').fontSize(32).fillColor(kpi.color)
        .text(String(kpi.value), x, y, { width: kpiSpacing, align: 'center' });
      doc.font('Helvetica').fontSize(11).fillColor('#64748b')
        .text(kpi.label, x, y + 42, { width: kpiSpacing, align: 'center' });
    });

    y += 75;

    // ── Resolution Rate ──
    const barWidth = contentWidth - 60;
    const barHeight = 6;
    const filledWidth = (barWidth * stats.resolutionRate) / 100;

    doc.font('Helvetica').fontSize(10).fillColor('#64748b')
      .text('Tasa de resolucion', margin, y, { width: contentWidth - 60, continued: true });
    doc.font('Helvetica-Bold').fontSize(14).fillColor('#10B981')
      .text(`  ${stats.resolutionRate}%`, { align: 'right' });

    y += 22;

    // Background bar
    doc.roundedRect(margin, y, barWidth, barHeight, 3).fill('#f1f5f9');
    // Filled bar
    doc.roundedRect(margin, y, filledWidth, barHeight, 3).fill('#10B981');

    y += 25;

    // Thin divider
    doc.strokeColor('#e2e8f0').lineWidth(1)
      .moveTo(margin, y).lineTo(pageWidth - margin, y).stroke();
    y += 20;

    // ── Recent Tickets ──
    doc.font('Helvetica-Bold').fontSize(14).fillColor('#1e293b').text('Tickets Recientes', margin, y);
    y += 25;

    // Column positions (A4 = 595pt wide, margin=50)
    const colTitle = margin;
    const colPriority = margin + 260;
    const colStatus = margin + 360;
    const colDate = pageWidth - margin;

    // Table header
    doc.font('Helvetica-Bold').fontSize(9).fillColor('#94a3b8');
    doc.text('TICKET', colTitle, y);
    doc.text('PRIORIDAD', colPriority, y);
    doc.text('ESTADO', colStatus, y);
    doc.text('CREADO', colDate - 80, y);

    y += 16;

    // Header underline
    doc.strokeColor('#e2e8f0').lineWidth(0.5)
      .moveTo(margin, y).lineTo(pageWidth - margin, y).stroke();
    y += 8;

    if (stats.recent.length === 0) {
      y += 20;
      doc.font('Helvetica').fontSize(11).fillColor('#94a3b8')
        .text('No hay tickets recientes', margin, y, { width: contentWidth, align: 'center' });
    } else {
      stats.recent.forEach((ticket, i) => {
        if (y > doc.page.height - 80) {
          doc.addPage();
          y = 50;
        }

        y += 4;

        // Alternating row background
        if (i % 2 === 0) {
          doc.roundedRect(margin - 4, y - 2, contentWidth + 8, 26, 4).fill('#fafbfc');
        }

        // Title (constrained width)
        doc.font('Helvetica').fontSize(10).fillColor('#334155');
        const maxTitleChars = 36;
        const titleText = ticket.title.length > maxTitleChars ? ticket.title.substring(0, maxTitleChars - 2) + '...' : ticket.title;
        doc.text(titleText, colTitle + 4, y, { width: colPriority - colTitle - 20, height: 20, ellipsis: true });

        // Priority with colored dot
        const pColor = priorityColor(ticket.priority);
        doc.circle(colPriority + 6, y + 6, 4).fill(pColor);
        doc.font('Helvetica').fontSize(9).fillColor('#475569').text(priorityLabel(ticket.priority), colPriority + 16, y, { width: 70 });

        // Status with colored dot
        const sColor = statusColor(ticket.status);
        doc.circle(colStatus + 6, y + 6, 4).fill(sColor);
        doc.font('Helvetica').fontSize(9).fillColor('#475569').text(statusLabel(ticket.status), colStatus + 16, y, { width: 70 });

        // Date (right-aligned at colDate)
        const dateStr = ticket.createdAt;
        const dateW = doc.widthOfString(dateStr);
        doc.font('Helvetica').fontSize(9).fillColor('#94a3b8').text(dateStr, colDate - dateW, y);

        y += 26;
      });
    }

    // ── Footer ──
    const pageBottom = doc.page.height - 50;
    doc.strokeColor('#e2e8f0').lineWidth(0.5)
      .moveTo(margin, pageBottom - 10).lineTo(pageWidth - margin, pageBottom - 10).stroke();
    doc.font('Helvetica').fontSize(8).fillColor('#cbd5e1')
      .text('Ticket Manager  •  Reporte generado automaticamente', margin, pageBottom + 2, { width: contentWidth, align: 'center' });

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
