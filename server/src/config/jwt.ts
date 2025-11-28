import dotenv from 'dotenv';

dotenv.config();

export const jwtConfig = {
  secret: process.env.JWT_SECRET || 'fallback-secret-change-in-production',
  expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  rememberExpiresIn: process.env.JWT_REMEMBER_EXPIRES_IN || '30d',
};
