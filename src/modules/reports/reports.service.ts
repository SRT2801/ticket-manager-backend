import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as ExcelJS from 'exceljs';
import { Ticket } from '../tickets/entities/ticket.entity';
import { ExportTicketsQueryDto } from './dto/export-tickets-query.dto';
import { UserRole } from '../../common/enums/user-role.enum';
import { TicketStatus, TicketPriority } from '../../common/enums/ticket.enums';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Ticket)
    private ticketsRepository: Repository<Ticket>,
  ) {}

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }

  async exportTickets(
    userId: number,
    userRole: UserRole,
    filters: ExportTicketsQueryDto,
  ): Promise<Buffer> {
    const whereClause: any = {};

    if (userRole !== UserRole.ADMIN) {
      whereClause.userId = userId;
    }

    if (filters.status) {
      whereClause.status = filters.status;
    }

    if (filters.startDate || filters.endDate) {
      if (
        filters.startDate &&
        filters.endDate &&
        filters.startDate > filters.endDate
      ) {
        throw new BadRequestException('Start date cannot be after end date');
      }
      whereClause.createdAt = {};
      if (filters.startDate) {
        whereClause.createdAt.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        whereClause.createdAt.lte = new Date(
          filters.endDate + 'T23:59:59.999Z',
        );
      }
    }

    const tickets = await this.ticketsRepository.find({
      where: whereClause,
      relations: { user: true },
      order: { createdAt: 'ASC' },
    });

    if (tickets.length === 0) {
      throw new NotFoundException(
        'No tickets found matching the specified filters',
      );
    }

    const workbook = new ExcelJS.Workbook();

    const ticketsSheet = workbook.addWorksheet('Tickets');
    this.addTicketsSheet(ticketsSheet, tickets);

    const statsSheet = workbook.addWorksheet('Estadisticas');
    this.addStatsSheet(statsSheet, tickets);

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  async exportTicketById(
    userId: number,
    userRole: UserRole,
    ticketId: number,
  ): Promise<Buffer> {
    const ticket = await this.ticketsRepository.findOne({
      where: { id: ticketId },
      relations: { user: true },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    if (userRole !== UserRole.ADMIN && ticket.userId !== userId) {
      throw new ForbiddenException('You can only export your own tickets');
    }

    const workbook = new ExcelJS.Workbook();

    const detailSheet = workbook.addWorksheet('Detalle del Ticket');
    this.addDetailSheet(detailSheet, ticket);

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  private addTicketsSheet(
    worksheet: ExcelJS.Worksheet,
    tickets: Ticket[],
  ): void {
    worksheet.columns = [
      { header: 'ID', key: 'id', width: 8 },
      { header: 'Título', key: 'title', width: 35 },
      { header: 'Descripción', key: 'description', width: 50 },
      { header: 'Usuario', key: 'userName', width: 20 },
      { header: 'Email', key: 'userEmail', width: 30 },
      { header: 'Prioridad', key: 'priority', width: 12 },
      { header: 'Estado', key: 'status', width: 15 },
      { header: 'Creado', key: 'createdAt', width: 22 },
      { header: 'Actualizado', key: 'updatedAt', width: 22 },
    ];

    worksheet.getRow(1).eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' },
      };
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.alignment = {
        vertical: 'middle',
        horizontal: 'center',
      };
    });

    tickets.forEach((ticket) => {
      const row = worksheet.addRow({
        id: ticket.id,
        title: ticket.title,
        description: ticket.description,
        userName: ticket.user?.name || 'N/A',
        userEmail: ticket.user?.email || 'N/A',
        priority: ticket.priority,
        status: ticket.status,
        createdAt: this.formatDate(ticket.createdAt),
        updatedAt: this.formatDate(ticket.updatedAt),
      });

      row.getCell(1).alignment = { horizontal: 'center' };
      row.getCell(6).alignment = { horizontal: 'center' };
      row.getCell(7).alignment = { horizontal: 'center' };

      if (ticket.priority === TicketPriority.HIGH) {
        row.getCell(6).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFCDCD' },
        };
      } else if (ticket.priority === TicketPriority.MEDIUM) {
        row.getCell(6).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFF2CC' },
        };
      } else {
        row.getCell(6).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFD9EAD3' },
        };
      }

      if (ticket.status === TicketStatus.OPEN) {
        row.getCell(7).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFCDCD' },
        };
      } else if (ticket.status === TicketStatus.IN_PROGRESS) {
        row.getCell(7).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFF2CC' },
        };
      } else {
        row.getCell(7).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFD9EAD3' },
        };
      }
    });
  }

  private addDetailSheet(worksheet: ExcelJS.Worksheet, ticket: Ticket): void {
    const priorityColor =
      ticket.priority === TicketPriority.HIGH
        ? 'FFFFCDCD'
        : ticket.priority === TicketPriority.MEDIUM
          ? 'FFFFF2CC'
          : 'FFD9EAD3';

    const statusColor =
      ticket.status === TicketStatus.OPEN
        ? 'FFFFCDCD'
        : ticket.status === TicketStatus.IN_PROGRESS
          ? 'FFFFF2CC'
          : 'FFD9EAD3';

    worksheet.addRow(['ID', ticket.id.toString()]);
    worksheet.addRow(['Título', ticket.title]);
    worksheet.addRow(['Descripción', ticket.description]);
    const priorityRow = worksheet.addRow(['Prioridad', ticket.priority]);
    priorityRow.getCell(2).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: priorityColor },
    };
    const statusRow = worksheet.addRow(['Estado', ticket.status]);
    statusRow.getCell(2).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: statusColor },
    };
    worksheet.addRow(['Usuario', ticket.user?.name || 'N/A']);
    worksheet.addRow(['Email', ticket.user?.email || 'N/A']);
    worksheet.addRow(['Fecha de Creación', this.formatDate(ticket.createdAt)]);
    worksheet.addRow([
      'Última Actualización',
      this.formatDate(ticket.updatedAt),
    ]);

    worksheet.getColumn(1).eachCell((cell) => {
      cell.font = { bold: true };
    });

    const maxKeyLength = Math.max(
      ...[
        'ID',
        'Título',
        'Descripción',
        'Prioridad',
        'Estado',
        'Usuario',
        'Email',
        'Fecha de Creación',
        'Última Actualización',
      ].map((s) => s.length),
    );
    const maxValueLength = Math.max(
      ticket.id.toString().length,
      ticket.title.length,
      ticket.description.length,
      ticket.priority.length,
      ticket.status.length,
      (ticket.user?.name || 'N/A').length,
      (ticket.user?.email || 'N/A').length,
      this.formatDate(ticket.createdAt).length,
      this.formatDate(ticket.updatedAt).length,
    );

    worksheet.getColumn(1).width = maxKeyLength + 5;
    worksheet.getColumn(2).width = Math.max(maxValueLength + 5, 40);
  }

  private calculateStats(tickets: Ticket[]) {
    const total = tickets.length;

    const statusCounts: Record<string, number> = {
      [TicketStatus.OPEN]: 0,
      [TicketStatus.IN_PROGRESS]: 0,
      [TicketStatus.CLOSED]: 0,
    };

    const priorityCounts: Record<string, number> = {
      [TicketPriority.HIGH]: 0,
      [TicketPriority.MEDIUM]: 0,
      [TicketPriority.LOW]: 0,
    };

    for (const ticket of tickets) {
      statusCounts[ticket.status]++;
      priorityCounts[ticket.priority]++;
    }

    const pct = (count: number) => (total > 0 ? count / total : 0);

    return {
      total,
      statuses: [
        {
          label: 'Abierto',
          count: statusCounts[TicketStatus.OPEN],
          pct: pct(statusCounts[TicketStatus.OPEN]),
          color: 'FFD32F2F',
        },
        {
          label: 'En Progreso',
          count: statusCounts[TicketStatus.IN_PROGRESS],
          pct: pct(statusCounts[TicketStatus.IN_PROGRESS]),
          color: 'FFF9A825',
        },
        {
          label: 'Cerrado',
          count: statusCounts[TicketStatus.CLOSED],
          pct: pct(statusCounts[TicketStatus.CLOSED]),
          color: 'FF2E7D32',
        },
      ],
      priorities: [
        {
          label: 'Alta',
          count: priorityCounts[TicketPriority.HIGH],
          pct: pct(priorityCounts[TicketPriority.HIGH]),
          color: 'FFD32F2F',
        },
        {
          label: 'Media',
          count: priorityCounts[TicketPriority.MEDIUM],
          pct: pct(priorityCounts[TicketPriority.MEDIUM]),
          color: 'FFF9A825',
        },
        {
          label: 'Baja',
          count: priorityCounts[TicketPriority.LOW],
          pct: pct(priorityCounts[TicketPriority.LOW]),
          color: 'FF2E7D32',
        },
      ],
    };
  }

  private addStatsSheet(worksheet: ExcelJS.Worksheet, tickets: Ticket[]): void {
    const stats = this.calculateStats(tickets);

    const titleRow = worksheet.addRow([
      'REPORTE DE TICKETS — RESUMEN ESTADÍSTICO',
    ]);
    worksheet.mergeCells('A1:C1');
    titleRow.getCell(1).font = {
      bold: true,
      size: 16,
      color: { argb: 'FF1A237E' },
    };
    titleRow.getCell(1).alignment = {
      horizontal: 'center',
      vertical: 'middle',
    };
    titleRow.height = 30;

    const dateRow = worksheet.addRow([
      `Generado: ${new Date().toLocaleString('es-ES', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`,
    ]);
    worksheet.mergeCells('A2:C2');
    dateRow.getCell(1).font = {
      italic: true,
      size: 10,
      color: { argb: 'FF757575' },
    };
    dateRow.getCell(1).alignment = { horizontal: 'center' };

    worksheet.addRow([]);

    const totalRow = worksheet.addRow([`Total de Tickets:  ${stats.total}`]);
    worksheet.mergeCells('A4:C4');
    totalRow.getCell(1).font = {
      bold: true,
      size: 13,
      color: { argb: 'FFFFFFFF' },
    };
    totalRow.getCell(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1A237E' },
    };
    totalRow.getCell(1).alignment = {
      horizontal: 'center',
      vertical: 'middle',
    };
    totalRow.height = 28;

    worksheet.addRow([]);

    let row = 7;

    const statusHeaderRow = worksheet.addRow(['DISTRIBUCIÓN POR ESTADO']);
    worksheet.mergeCells(row, 1, row, 3);
    statusHeaderRow.getCell(1).font = {
      bold: true,
      size: 13,
      color: { argb: 'FF1A237E' },
    };
    statusHeaderRow.height = 24;
    row++;

    const statusColsRow = worksheet.addRow(['Estado', 'Cantidad', '%']);
    statusColsRow.eachCell((cell) => {
      cell.font = { bold: true, size: 10, color: { argb: 'FFFFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF3F51B5' },
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });
    statusColsRow.height = 22;
    row++;

    for (const item of stats.statuses) {
      const dataRow = worksheet.addRow([
        `● ${item.label}`,
        item.count,
        item.pct,
      ]);
      dataRow.getCell(1).font = { bold: true, color: { argb: item.color } };
      dataRow.getCell(2).alignment = { horizontal: 'center' };
      dataRow.getCell(3).numFmt = '0%';
      dataRow.getCell(3).alignment = { horizontal: 'center' };
      dataRow.height = 20;
      row++;
    }

    worksheet.addRow([]);
    row += 2;

    const priorityHeaderRow = worksheet.addRow(['DISTRIBUCIÓN POR PRIORIDAD']);
    worksheet.mergeCells(row, 1, row, 3);
    priorityHeaderRow.getCell(1).font = {
      bold: true,
      size: 13,
      color: { argb: 'FF1A237E' },
    };
    priorityHeaderRow.height = 24;
    row++;

    const priorityColsRow = worksheet.addRow(['Prioridad', 'Cantidad', '%']);
    priorityColsRow.eachCell((cell) => {
      cell.font = { bold: true, size: 10, color: { argb: 'FFFFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF3F51B5' },
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });
    priorityColsRow.height = 22;
    row++;

    for (const item of stats.priorities) {
      const dataRow = worksheet.addRow([
        `● ${item.label}`,
        item.count,
        item.pct,
      ]);
      dataRow.getCell(1).font = { bold: true, color: { argb: item.color } };
      dataRow.getCell(2).alignment = { horizontal: 'center' };
      dataRow.getCell(3).numFmt = '0%';
      dataRow.getCell(3).alignment = { horizontal: 'center' };
      dataRow.height = 20;
      row++;
    }

    this.autoFitColumns(worksheet);
  }

  private autoFitColumns(worksheet: ExcelJS.Worksheet): void {
    const columnCount = worksheet.columnCount || 3;
    for (let col = 1; col <= columnCount; col++) {
      let maxLength = 0;
      worksheet.getColumn(col).eachCell({ includeEmpty: false }, (cell) => {
        const length = String(cell.value ?? '').length;
        if (length > maxLength) maxLength = length;
      });
      worksheet.getColumn(col).width = Math.max(maxLength + 4, 10);
    }
  }
}
