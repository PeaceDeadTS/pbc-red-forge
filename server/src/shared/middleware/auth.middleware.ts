import { Request, Response, NextFunction } from 'express';
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

/**
 * Authentication middleware - blocks request if not authenticated
 */
export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Token not provided' });
      return;
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, jwtConfig.secret) as AuthPayload;

    // Verify session exists and is not expired
    const [sessions] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM sessions WHERE id = ? AND user_id = ? AND expires_at > NOW()',
      [decoded.sessionId, decoded.userId]
    );

    if (sessions.length === 0) {
      res.status(401).json({ error: 'Session expired or invalid' });
      return;
    }

    req.user = {
      id: decoded.userId,
      sessionId: decoded.sessionId,
    };

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
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      next();
      return;
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, jwtConfig.secret) as AuthPayload;

    const [sessions] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM sessions WHERE id = ? AND user_id = ? AND expires_at > NOW()',
      [decoded.sessionId, decoded.userId]
    );

    if (sessions.length > 0) {
      req.user = {
        id: decoded.userId,
        sessionId: decoded.sessionId,
      };
    }

    next();
  } catch {
    // Ignore token errors for optional authentication
    next();
  }
};
