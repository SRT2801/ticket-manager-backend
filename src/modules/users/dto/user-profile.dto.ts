import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../../common/enums/user-role.enum';

export class UserProfileDto {
  @ApiProperty({ example: 1, description: 'ID único del usuario' })
  id!: number;

  @ApiProperty({
    example: 'usuario@ejemplo.com',
    description: 'Correo electrónico del usuario',
  })
  email: string;

  @ApiProperty({
    example: 'Juan Pérez',
    description: 'Nombre completo del usuario',
  })
  name: string;

  @ApiProperty({
    enum: UserRole,
    example: UserRole.USER,
    description: 'Rol del usuario',
  })
  role: UserRole;

  @ApiProperty({
    example: '2026-06-18T10:30:00.000Z',
    description: 'Fecha de creación de la cuenta',
  })
  createdAt: Date;

  @ApiProperty({
    example: '2026-06-18T10:30:00.000Z',
    description: 'Fecha de última actualización',
  })
  updatedAt: Date;
}
