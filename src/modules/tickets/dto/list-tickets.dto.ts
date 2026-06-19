import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { TicketStatus } from '../../../common/enums/ticket.enums';

export class ListTicketsDto {
  @ApiPropertyOptional({
    enum: TicketStatus,
    example: TicketStatus.OPEN,
    description: 'Filtrar por estado del ticket',
  })
  @IsOptional()
  @IsEnum(TicketStatus)
  status?: TicketStatus;

  @ApiPropertyOptional({
    example: 1,
    description: 'Número de página (por defecto 1)',
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    example: 10,
    description: 'Cantidad de tickets por página (por defecto 10)',
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;
}
