import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../../common/enums/user-role.enum';

export class UserDto {
  @ApiProperty({ example: 1, description: 'ID único del usuario' })
  id: number;

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
}

export class AuthResponseDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'Token JWT de autenticación',
  })
  accessToken: string;

  @ApiProperty({
    type: UserDto,
    description: 'Datos del usuario autenticado',
  })
  user: UserDto;
}
