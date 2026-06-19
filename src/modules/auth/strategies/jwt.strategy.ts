import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { jwtConfig } from '../../../config';
import { UsersService } from '../../users/users.service';
import { JwtPayload } from '../../../common/interfaces/jwt-payload.interface';
import { CurrentUserPayload } from '../../../common/interfaces/current-user.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly usersService: UsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtConfig().secret,
    });
  }

  async validate(payload: JwtPayload): Promise<CurrentUserPayload & { email: string; name: string }> {
    const user = await this.usersService.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('Invalid token');
    }
    return { id: user.id, email: user.email, name: user.name, role: user.role };
  }
}
