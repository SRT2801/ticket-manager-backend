import { ApiProperty } from '@nestjs/swagger';
import {
  TicketPriority,
  TicketStatus,
} from '../../../common/enums/ticket.enums';

export class TicketResponseDto {
  @ApiProperty({ example: 1, description: 'ID único del ticket' })
  id!: number;

  @ApiProperty({
    example: 'Error al iniciar sesión',
    description: 'Título del ticket',
  })
  title: string;

  @ApiProperty({
    example: 'El usuario no puede iniciar sesión...',
    description: 'Descripción detallada del problema',
  })
  description: string;

  @ApiProperty({
    enum: TicketPriority,
    example: TicketPriority.HIGH,
    description: 'Prioridad del ticket',
  })
  priority: TicketPriority;

  @ApiProperty({
    enum: TicketStatus,
    example: TicketStatus.OPEN,
    description: 'Estado actual del ticket',
  })
  status: TicketStatus;

  @ApiProperty({
    example: 1,
    description: 'ID del usuario propietario del ticket',
  })
  userId: number;

  @ApiProperty({
    example: '2026-06-18T10:30:00.000Z',
    description: 'Fecha de creación del ticket',
  })
  createdAt: Date;

  @ApiProperty({
    example: '2026-06-18T14:45:00.000Z',
    description: 'Fecha de última actualización',
  })
  updatedAt: Date;
}
