import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  Res,
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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CurrentUserPayload } from '../../common/interfaces/current-user.interface';
import { UserRole } from '../../common/enums/user-role.enum';

@ApiTags('reports')
@ApiBearerAuth('JWT-auth')
@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

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
