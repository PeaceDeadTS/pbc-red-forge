import dotenv from 'dotenv';
import type { SignOptions } from 'jsonwebtoken';

dotenv.config();

export interface JwtConfig {
  secret: string;
  expiresIn: SignOptions['expiresIn'];
  rememberExpiresIn: SignOptions['expiresIn'];
}

export const jwtConfig: JwtConfig = {
  secret: process.env.JWT_SECRET || 'fallback-secret-change-in-production',
  expiresIn: (process.env.JWT_EXPIRES_IN || '1d') as SignOptions['expiresIn'],
  rememberExpiresIn: (process.env.JWT_REMEMBER_EXPIRES_IN || '30d') as SignOptions['expiresIn'],
};
