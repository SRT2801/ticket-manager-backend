export const jwtConfig = () => ({
  secret: process.env.JWT_SECRET || 'default-secret-change-me',
  expiresIn: process.env.JWT_EXPIRATION || '24h',
});
