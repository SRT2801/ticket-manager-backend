import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

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

  async sendExcelReport(
    email: string,
    buffer: Buffer,
    dateStr: string,
  ): Promise<void> {
    const filename = `tickets_export_${new Date().toISOString().split('T')[0]}.xlsx`;

    await this.transporter.sendMail({
      from: process.env.MAIL_FROM || 'noreply@ticket-manager.com',
      to: email,
      subject: `Ticket Manager — Reporte Semanal ${dateStr}`,
      text: `Adjunto encontraras el reporte semanal de tickets del ${dateStr}.`,
      attachments: [
        {
          filename,
          content: buffer,
          contentType:
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        },
      ],
    });
  }
}
