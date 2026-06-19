import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { TicketPriority } from '../../../common/enums/ticket.enums';

export class CreateTicketDto {
  @ApiProperty({
    example: 'Error al iniciar sesión',
    description: 'Título del ticket de soporte',
  })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({
    example:
      'El usuario no puede iniciar sesión desde esta mañana. Recibe un error 500.',
    description: 'Descripción detallada del problema',
  })
  @IsString()
  @IsNotEmpty()
  description!: string;

  @ApiPropertyOptional({
    enum: TicketPriority,
    example: TicketPriority.MEDIUM,
    description: 'Prioridad del ticket (por defecto MEDIUM)',
  })
  @IsOptional()
  @IsEnum(TicketPriority)
  priority?: TicketPriority;
}
