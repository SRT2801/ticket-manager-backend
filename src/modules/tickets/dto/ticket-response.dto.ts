import { TicketPriority, TicketStatus } from '../../../common/enums/ticket.enums';

export class TicketResponseDto {
  id!: number;
  title!: string;
  description!: string;
  priority!: TicketPriority;
  status!: TicketStatus;
  userId!: number;
  createdAt!: Date;
  updatedAt!: Date;
}
