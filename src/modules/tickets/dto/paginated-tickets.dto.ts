import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { TicketResponseDto } from './ticket-response.dto';

class PaginationMeta {
  @ApiProperty({ example: 25, description: 'Total de tickets' })
  total: number;

  @ApiProperty({ example: 1, description: 'Página actual' })
  page: number;

  @ApiProperty({ example: 10, description: 'Tickets por página' })
  limit: number;

  @ApiProperty({ example: 3, description: 'Total de páginas' })
  totalPages: number;
}

export class PaginatedTicketsDto {
  @ApiProperty({
    type: [TicketResponseDto],
    description: 'Lista de tickets',
  })
  data: TicketResponseDto[];

  @ApiProperty({
    type: PaginationMeta,
    description: 'Metadatos de paginación',
  })
  pagination: PaginationMeta;
}
