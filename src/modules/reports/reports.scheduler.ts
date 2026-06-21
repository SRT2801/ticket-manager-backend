import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ReportsService } from './reports.service';
import { MailService } from '../mail/mail.service';
import { UserRole } from '../../common/enums/user-role.enum';

function formatDate(date: Date): string {
  return date.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

@Injectable()
export class ReportsScheduler {
  private readonly logger = new Logger(ReportsScheduler.name);

  constructor(
    private readonly reportsService: ReportsService,
    private readonly mailService: MailService,
  ) {}

  @Cron('0 8 * * 1')
  async sendWeeklyReport() {
    this.logger.log('Generando reporte semanal de tickets...');

    const recipients = (process.env.REPORT_RECIPIENTS || '')
      .split(',')
      .map((e) => e.trim())
      .filter(Boolean);

    if (recipients.length === 0) {
      this.logger.warn('REPORT_RECIPIENTS no configurado. Reporte no enviado.');
      return;
    }

    try {
      const buffer = await this.reportsService.exportTickets(
        1,
        UserRole.ADMIN,
        {},
      );

      const date = formatDate(new Date());

      for (const recipient of recipients) {
        await this.mailService.sendExcelReport(recipient, buffer, date);
        this.logger.log(`Reporte enviado a ${recipient}`);
      }
    } catch (error) {
      this.logger.error('Error al enviar reporte semanal:', error);
    }
  }
}
