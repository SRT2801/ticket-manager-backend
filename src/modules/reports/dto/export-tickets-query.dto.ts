import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsDateString } from 'class-validator';
import { TicketStatus } from '../../../common/enums/ticket.enums';

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
