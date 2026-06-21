import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  Res,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { ReportsService } from './reports.service';
import { ExportTicketsQueryDto } from './dto/export-tickets-query.dto';
import { SendReportDto } from './dto/send-report.dto';
import { TicketsService } from '../tickets/tickets.service';
import { MailService } from '../mail/mail.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CurrentUserPayload } from '../../common/interfaces/current-user.interface';
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

@ApiTags('reports')
@ApiBearerAuth('JWT-auth')
@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(
    private readonly reportsService: ReportsService,
    private readonly ticketsService: TicketsService,
    private readonly mailService: MailService,
  ) {}

  @Post('send-dashboard')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Enviar reporte del dashboard por correo',
    description:
      'Genera un resumen del dashboard (KPIs, tasa de resolucion, tickets recientes) y lo envia por correo electronico.',
  })
  @ApiResponse({ status: 200, description: 'Correo enviado correctamente' })
  @ApiResponse({ status: 400, description: 'Email invalido' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async sendDashboardReport(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: SendReportDto,
  ) {
    const stats = await this.ticketsService.getStats(user.id, user.role);
    const total = stats.byStatus.reduce((sum, s) => sum + s.count, 0);
    const open = stats.byStatus.find((s) => s.status === 'OPEN')?.count || 0;
    const inProgress = stats.byStatus.find((s) => s.status === 'IN_PROGRESS')?.count || 0;
    const closed = stats.byStatus.find((s) => s.status === 'CLOSED')?.count || 0;
    const rate = total > 0 ? Math.round((closed / total) * 100) : 0;

    const date = formatDate(new Date());

    await this.mailService.sendDashboardReport(
      dto.email,
      {
        total,
        open,
        inProgress,
        closed,
        resolutionRate: rate,
        recent: stats.recent.map((t) => ({
          title: t.title,
          priority: t.priority,
          status: t.status,
          createdAt: formatDate(t.createdAt),
        })),
      },
      date,
    );

    return { message: 'Reporte enviado correctamente', to: dto.email };
  }

  @Get('tickets/export')
  @ApiOperation({
    summary: 'Exportar tickets a Excel',
    description:
      'Exporta una lista de tickets en formato Excel (.xlsx), respetando los filtros aplicados.',
  })
  @ApiResponse({
    status: 200,
    description:
      'Archivo Excel generado correctamente con los headers de Content-Disposition',
  })
  @ApiResponse({ status: 400, description: 'Filtros de fecha inválidos' })
  @ApiResponse({ status: 401, description: 'No autorizado - Token inválido' })
  @ApiResponse({ status: 404, description: 'No se encontraron tickets' })
  async exportTickets(
    @CurrentUser() user: CurrentUserPayload,
    @Query() filters: ExportTicketsQueryDto,
    @Res() res: Response,
  ) {
    const buffer = await this.reportsService.exportTickets(
      user.id,
      user.role,
      filters,
    );
    const date = new Date().toISOString().split('T')[0];
    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="tickets_export_${date}.xlsx"`,
    });
    res.send(buffer);
  }

  @Get('tickets/:id/export')
  @ApiOperation({
    summary: 'Exportar detalle de ticket a Excel',
    description:
      'Exporta el detalle de un ticket específico en formato Excel (.xlsx) con formato clave-valor.',
  })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'ID del ticket a exportar',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description:
      'Archivo Excel generado correctamente con el detalle del ticket',
  })
  @ApiResponse({ status: 401, description: 'No autorizado - Token inválido' })
  @ApiResponse({ status: 404, description: 'Ticket no encontrado' })
  @ApiResponse({
    status: 403,
    description: 'No tienes permiso para exportar este ticket',
  })
  async exportTicketById(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ) {
    const buffer = await this.reportsService.exportTicketById(
      user.id,
      user.role,
      id,
    );
    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="ticket_${id}_detail.xlsx"`,
    });
    res.send(buffer);
  }
}
