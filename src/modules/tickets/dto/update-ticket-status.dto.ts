import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { TicketStatus } from '../../../common/enums/ticket.enums';

export class UpdateTicketStatusDto {
  @ApiProperty({
    enum: TicketStatus,
    example: TicketStatus.IN_PROGRESS,
    description: 'Nuevo estado del ticket',
  })
  @IsEnum(TicketStatus)
  status!: TicketStatus;
}
