import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserProfileDto } from './dto/user-profile.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../common/enums/user-role.enum';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  async getProfile(@CurrentUser() user: { id: number; role: UserRole }): Promise<UserProfileDto> {
    const fullUser = await this.usersService.findById(user.id);
    if (!fullUser) {
      throw new Error('User not found');
    }
    const { password, ...profile } = fullUser;
    return profile as UserProfileDto;
  }

  @Patch('profile')
  async updateProfile(
    @CurrentUser() user: { id: number; role: UserRole },
    @Body() dto: UpdateUserDto,
  ): Promise<UserProfileDto> {
    const { password, ...profile } = await this.usersService.update(user.id, dto);
    return profile as UserProfileDto;
  }
}
