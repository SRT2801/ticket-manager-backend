import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateUserDto {
  @ApiPropertyOptional({
    example: 'nuevo@ejemplo.com',
    description: 'Nuevo correo electrónico (opcional)',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    example: 'NuevaPassword123!',
    description: 'Nueva contraseña (mínimo 6 caracteres, opcional)',
  })
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @ApiPropertyOptional({
    example: 'Juan Pérez Actualizado',
    description: 'Nuevo nombre (opcional)',
  })
  @IsOptional()
  @IsString()
  name?: string;
}
