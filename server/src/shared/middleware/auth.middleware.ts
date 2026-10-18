import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { jwtConfig } from '../config/index.js';
import { pool } from '../database/index.js';
import { RowDataPacket } from 'mysql2';

export interface AuthPayload {
  userId: string;
  sessionId: string;
}

export interface AuthRequest extends Request {
  user?: {
    id: string;
    sessionId: string;
  };
}

const verifyOptions: jwt.VerifyOptions = { algorithms: ['HS256'] };

const readActiveSession = async (token: string): Promise<{ id: string; sessionId: string } | null> => {
  const decoded = jwt.verify(token, jwtConfig.secret, verifyOptions) as AuthPayload;
  if (typeof decoded?.userId !== 'string' || typeof decoded?.sessionId !== 'string') {
    return null;
  }

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const [sessions] = await pool.execute<RowDataPacket[]>(
    'SELECT id FROM sessions WHERE id = ? AND user_id = ? AND token_hash = ? AND expires_at > NOW()',
    [decoded.sessionId, decoded.userId, tokenHash]
  );

  if (sessions.length === 0) {
    return null;
  }

  return {
    id: decoded.userId,
    sessionId: decoded.sessionId,
  };
};

const bearerToken = (req: Request): string | null => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
};

/**
 * Authentication middleware - blocks request if not authenticated
 */
export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = bearerToken(req);
    if (!token) {
      res.status(401).json({ error: 'Token not provided' });
      return;
    }

    const session = await readActiveSession(token);
    if (!session) {
      res.status(401).json({ error: 'Session expired or invalid' });
      return;
    }

    req.user = session;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: 'Token expired' });
      return;
    }
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }
    res.status(500).json({ error: 'Authentication error' });
  }
};

/**
 * Optional authentication middleware - does not block request
 */
export const optionalAuthMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = bearerToken(req);
    if (!token) {
      next();
      return;
    }

    const session = await readActiveSession(token);
    if (session) {
      req.user = session;
    }

    next();
  } catch {
    next();
  }
};
