import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

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

function buildDashboardHtml(stats: DashboardStats, date: string): string {
  const ticketRows = stats.recent.length > 0
    ? stats.recent.map((t) => `
      <tr style="border-bottom:1px solid #1e293b">
        <td style="padding:12px;color:#e4e1ed;font-size:13px">${t.title}</td>
        <td style="padding:12px;text-align:center">
          <span style="background:${priorityColor(t.priority)}22;color:${priorityColor(t.priority)};padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600">${priorityLabel(t.priority)}</span>
        </td>
        <td style="padding:12px;text-align:center">
          <span style="background:${statusColor(t.status)}22;color:${statusColor(t.status)};padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600">${statusLabel(t.status)}</span>
        </td>
        <td style="padding:12px;color:#c7c4d7;font-size:12px;text-align:right">${t.createdAt}</td>
      </tr>
    `).join('')
    : '<tr><td colspan="4" style="padding:24px;text-align:center;color:#64748b">No hay tickets recientes</td></tr>';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
</head>
<body style="margin:0;padding:0;background:#0f172a;font-family:Arial,Helvetica,sans-serif;color:#e4e1ed">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:40px 0">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#1e293b;border-radius:16px;overflow:hidden">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#6366f1,#c0c1ff);padding:32px;text-align:center">
            <h1 style="margin:0;font-size:24px;color:#1000a9;font-weight:700">Ticket Manager</h1>
            <p style="margin:8px 0 0;font-size:14px;color:#0d0096;opacity:0.8">Reporte del Dashboard &bull; ${date}</p>
          </td>
        </tr>
        <!-- KPIs -->
        <tr>
          <td style="padding:24px 24px 0">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td width="25%" style="padding:0 8px 0 0" valign="top">
                  <div style="background:#6366f111;border:1px solid #6366f122;border-radius:12px;padding:16px;text-align:center">
                    <p style="margin:0;font-size:11px;color:#908fa0;text-transform:uppercase;letter-spacing:0.5px">Total</p>
                    <p style="margin:8px 0 0;font-size:28px;font-weight:700;color:#c0c1ff">${stats.total}</p>
                  </div>
                </td>
                <td width="25%" style="padding:0 8px" valign="top">
                  <div style="background:#F59E0B11;border:1px solid #F59E0B22;border-radius:12px;padding:16px;text-align:center">
                    <p style="margin:0;font-size:11px;color:#908fa0;text-transform:uppercase;letter-spacing:0.5px">Abiertos</p>
                    <p style="margin:8px 0 0;font-size:28px;font-weight:700;color:#F59E0B">${stats.open}</p>
                  </div>
                </td>
                <td width="25%" style="padding:0 8px" valign="top">
                  <div style="background:#6366f111;border:1px solid #6366f122;border-radius:12px;padding:16px;text-align:center">
                    <p style="margin:0;font-size:11px;color:#908fa0;text-transform:uppercase;letter-spacing:0.5px">En Progreso</p>
                    <p style="margin:8px 0 0;font-size:28px;font-weight:700;color:#6366f1">${stats.inProgress}</p>
                  </div>
                </td>
                <td width="25%" style="padding:0 0 0 8px" valign="top">
                  <div style="background:#10B98111;border:1px solid #10B98122;border-radius:12px;padding:16px;text-align:center">
                    <p style="margin:0;font-size:11px;color:#908fa0;text-transform:uppercase;letter-spacing:0.5px">Cerrados</p>
                    <p style="margin:8px 0 0;font-size:28px;font-weight:700;color:#10B981">${stats.closed}</p>
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <!-- Resolution Rate -->
        <tr>
          <td style="padding:16px 24px">
            <div style="background:#10B98111;border:1px solid #10B98122;border-radius:12px;padding:16px;text-align:center">
              <p style="margin:0;font-size:13px;color:#10B981;font-weight:600">Tasa de Resolucion: <span style="font-size:20px">${stats.resolutionRate}%</span></p>
            </div>
          </td>
        </tr>
        <!-- Recent Tickets Table -->
        <tr>
          <td style="padding:24px">
            <h2 style="margin:0 0 16px;font-size:18px;color:#e4e1ed">Tickets Recientes</h2>
            <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">
              <thead>
                <tr style="background:#0f172a;text-transform:uppercase;font-size:11px;letter-spacing:0.5px;color:#908fa0">
                  <th style="padding:12px;text-align:left;border-radius:8px 0 0 0">Ticket</th>
                  <th style="padding:12px;text-align:center">Prioridad</th>
                  <th style="padding:12px;text-align:center">Estado</th>
                  <th style="padding:12px;text-align:right;border-radius:0 8px 0 0">Creado</th>
                </tr>
              </thead>
              <tbody>${ticketRows}</tbody>
            </table>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:24px;border-top:1px solid #334155;text-align:center">
            <p style="margin:0;font-size:12px;color:#64748b">Ticket Manager &bull; Reporte generado automaticamente</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
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
    userName?: string,
  ): Promise<void> {
    const html = buildDashboardHtml(stats, date);

    await this.transporter.sendMail({
      from: process.env.MAIL_FROM || 'noreply@ticket-manager.com',
      to: email,
      subject: `Ticket Manager — Reporte ${date}`,
      html,
    });
  }
}
