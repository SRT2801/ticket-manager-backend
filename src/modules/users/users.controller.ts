import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserProfileDto } from './dto/user-profile.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../common/enums/user-role.enum';

@ApiTags('users')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  @ApiOperation({
    summary: 'Obtener perfil del usuario',
    description: 'Retorna los datos del usuario autenticado',
  })
  @ApiResponse({
    status: 200,
    description: 'Perfil obtenido correctamente',
    type: UserProfileDto,
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async getProfile(
    @CurrentUser() user: { id: number; role: UserRole },
  ): Promise<UserProfileDto> {
    const fullUser = await this.usersService.findById(user.id);
    if (!fullUser) {
      throw new Error('User not found');
    }
    const { password, ...profile } = fullUser;
    return profile;
  }

  @Patch('profile')
  @ApiOperation({
    summary: 'Actualizar perfil',
    description:
      'Actualiza los datos del usuario autenticado (email, name, password)',
  })
  @ApiResponse({
    status: 200,
    description: 'Perfil actualizado correctamente',
    type: UserProfileDto,
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async updateProfile(
    @CurrentUser() user: { id: number; role: UserRole },
    @Body() dto: UpdateUserDto,
  ): Promise<UserProfileDto> {
    const { password, ...profile } = await this.usersService.update(
      user.id,
      dto,
    );
    return profile;
  }
}
