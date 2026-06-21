import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ReportsService } from './reports.service';
import { MailService } from '../mail/mail.service';
import { UsersService } from '../users/users.service';
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
    private readonly usersService: UsersService,
  ) {}

  @Cron('0 8 * * 1')
  async sendWeeklyReport() {
    this.logger.log('Generando reportes semanales por usuario...');

    try {
      const users = await this.usersService.findAll();

      if (users.length === 0) {
        this.logger.warn('No hay usuarios registrados. Reporte no enviado.');
        return;
      }

      const date = formatDate(new Date());

      for (const user of users) {
        try {
          const buffer = await this.reportsService.exportTickets(
            user.id,
            UserRole.USER,
            {},
          );

          await this.mailService.sendExcelReport(user.email, buffer, date);
          this.logger.log(`Reporte enviado a ${user.email}`);
        } catch (error) {
          this.logger.error(`Error enviando reporte a ${user.email}:`, error);
        }
      }

      this.logger.log(`Reportes semanales completados. ${users.length} usuarios.`);
    } catch (error) {
      this.logger.error('Error al generar reportes semanales:', error);
    }
  }
}
