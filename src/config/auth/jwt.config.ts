import { registerAs } from '@nestjs/config';

export const jwtConfig = registerAs('jwt', () => ({
  secret: process.env.JWT_SECRET || 'default-secret-change-me',
  expiresIn: process.env.JWT_EXPIRATION || '24h',
}));
