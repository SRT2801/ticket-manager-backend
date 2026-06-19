import { IsEnum } from 'class-validator';
import { TicketStatus } from '../../../common/enums/ticket.enums';

export class UpdateTicketStatusDto {
  @IsEnum(TicketStatus)
  status!: TicketStatus;
}
