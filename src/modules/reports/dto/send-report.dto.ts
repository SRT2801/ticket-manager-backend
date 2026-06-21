import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class SendReportDto {
  @ApiProperty({
    example: 'admin@example.com',
    description: 'Correo electronico de destino',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
