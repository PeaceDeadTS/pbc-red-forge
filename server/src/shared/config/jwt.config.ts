import * as dotenv from 'dotenv';
import type { SignOptions } from 'jsonwebtoken';

dotenv.config();

export interface JwtConfig {
  secret: string;
  expiresIn: SignOptions['expiresIn'];
  rememberExpiresIn: SignOptions['expiresIn'];
}

const INSECURE_JWT_SECRETS = new Set([
  'fallback-secret-change-in-production',
  'your-super-secret-key-change-in-production',
]);

const jwtSecret = process.env.JWT_SECRET?.trim() ?? '';

if (jwtSecret.length < 32 || INSECURE_JWT_SECRETS.has(jwtSecret)) {
  throw new Error(
    'JWT_SECRET must be a unique value of at least 32 characters. ' +
      'Generate one with: node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"'
  );
}

export const jwtConfig: JwtConfig = {
  secret: jwtSecret,
  expiresIn: (process.env.JWT_EXPIRES_IN || '1d') as SignOptions['expiresIn'],
  rememberExpiresIn: (process.env.JWT_REMEMBER_EXPIRES_IN || '30d') as SignOptions['expiresIn'],
};
