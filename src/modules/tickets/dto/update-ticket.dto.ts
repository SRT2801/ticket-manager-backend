import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { TicketPriority } from '../../../common/enums/ticket.enums';

export class UpdateTicketDto {
  @ApiPropertyOptional({
    example: 'Error al iniciar sesion',
    description: 'Nuevo titulo del ticket',
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({
    example: 'El usuario no puede iniciar sesion. Recibe un error 500.',
    description: 'Nueva descripcion del ticket',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    enum: TicketPriority,
    example: TicketPriority.HIGH,
    description: 'Nueva prioridad del ticket',
  })
  @IsOptional()
  @IsEnum(TicketPriority)
  priority?: TicketPriority;
}
