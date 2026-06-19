import { TicketResponseDto } from './ticket-response.dto';

export class PaginatedTicketsDto {
  data!: TicketResponseDto[];
  pagination!: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
