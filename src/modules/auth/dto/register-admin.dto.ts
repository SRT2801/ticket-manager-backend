import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { UserRole } from '../../../common/enums/user-role.enum';

export class RegisterAdminDto {
  @ApiProperty({
    example: 'admin@empresa.com',
    description: 'Correo electrónico del administrador',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: 'AdminPassword123!',
    description: 'Contraseña del administrador (mínimo 6 caracteres)',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @ApiProperty({
    example: 'Administrador',
    description: 'Nombre completo del administrador',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    enum: UserRole,
    example: UserRole.ADMIN,
    description: 'Rol del usuario (debe ser ADMIN)',
  })
  @IsString()
  @IsNotEmpty()
  role: UserRole.ADMIN;
}
