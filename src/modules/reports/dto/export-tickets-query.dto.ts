import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsDateString } from 'class-validator';
import { TicketStatus, TicketPriority } from '../../../common/enums/ticket.enums';

export class ExportTicketsQueryDto {
  @ApiPropertyOptional({
    enum: TicketStatus,
    example: TicketStatus.OPEN,
    description: 'Filtrar tickets por estado',
  })
  @IsOptional()
  @IsEnum(TicketStatus)
  status?: TicketStatus;

  @ApiPropertyOptional({
    enum: TicketPriority,
    example: TicketPriority.HIGH,
    description: 'Filtrar tickets por prioridad',
  })
  @IsOptional()
  @IsEnum(TicketPriority)
  priority?: TicketPriority;

  @ApiPropertyOptional({
    example: '2026-06-01',
    description: 'Fecha de inicio del rango (YYYY-MM-DD)',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    example: '2026-06-30',
    description: 'Fecha de fin del rango (YYYY-MM-DD)',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
