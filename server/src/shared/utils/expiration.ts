import type { SignOptions } from 'jsonwebtoken';

/**
 * Parse JWT expiration time to milliseconds
 * Supports both numeric (seconds) and string formats ('1d', '2h', '30m', '60s')
 */
export function parseExpiration(exp: SignOptions['expiresIn']): number {
  // If numeric (seconds) - convert to milliseconds
  if (typeof exp === 'number') {
    return exp * 1000;
  }

  if (typeof exp !== 'string') {
    return 24 * 60 * 60 * 1000; // default 1 day
  }

  const match = exp.match(/^(\d+)([dhms])$/);
  if (!match) return 24 * 60 * 60 * 1000; // default 1 day

  const value = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case 'd': return value * 24 * 60 * 60 * 1000;
    case 'h': return value * 60 * 60 * 1000;
    case 'm': return value * 60 * 1000;
    case 's': return value * 1000;
    default: return 24 * 60 * 60 * 1000;
  }
}
