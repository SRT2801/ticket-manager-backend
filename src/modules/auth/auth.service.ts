import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { hash, compare } from 'bcrypt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { RegisterAdminDto } from './dto/register-admin.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { UserRole } from '../../common/enums/user-role.enum';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { CurrentUserPayload } from '../../common/interfaces/current-user.interface';
import { User } from '../users/entities/user.entity';

type UserProfile = Pick<User, 'id' | 'email' | 'name' | 'role'>;

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<UserProfile> {
    const existingUser = await this.usersService.findByEmail(dto.email);
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await hash(dto.password, 10);
    const user = await this.usersService.create({
      ...dto,
      password: hashedPassword,
      role: UserRole.USER,
    });

    return { id: user.id, email: user.email, name: user.name, role: user.role };
  }

  async registerAdmin(
    dto: RegisterAdminDto,
    requestingUser: CurrentUserPayload,
  ): Promise<UserProfile> {
    if (requestingUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can create other admins');
    }

    const existingUser = await this.usersService.findByEmail(dto.email);
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    if (dto.role !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'Only admin role can be created via this endpoint',
      );
    }

    const hashedPassword = await hash(dto.password, 10);
    const user = await this.usersService.create({
      ...dto,
      password: hashedPassword,
    });

    return { id: user.id, email: user.email, name: user.name, role: user.role };
  }

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload: JwtPayload = { sub: user.id, email: user.email, role: user.role };
    const profile: UserProfile = { id: user.id, email: user.email, name: user.name, role: user.role };
    return {
      accessToken: this.jwtService.sign(payload),
      user: profile,
    };
  }
}
