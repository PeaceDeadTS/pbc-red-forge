import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { jwtConfig } from '../config/jwt.js';
import { pool } from '../config/database.js';
import { AuthPayload } from '../types/user.js';
import { RowDataPacket } from 'mysql2';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    sessionId: string;
  };
}

export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Токен не предоставлен' });
      return;
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, jwtConfig.secret) as AuthPayload;

    // Проверяем, что сессия существует и не истекла
    const [sessions] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM sessions WHERE id = ? AND user_id = ? AND expires_at > NOW()',
      [decoded.sessionId, decoded.userId]
    );

    if (sessions.length === 0) {
      res.status(401).json({ error: 'Сессия истекла или недействительна' });
      return;
    }

    req.user = {
      id: decoded.userId,
      sessionId: decoded.sessionId,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: 'Токен истёк' });
      return;
    }
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ error: 'Недействительный токен' });
      return;
    }
    res.status(500).json({ error: 'Ошибка аутентификации' });
  }
};

// Опциональная аутентификация (не блокирует запрос)
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
    // Игнорируем ошибки токена для опциональной аутентификации
    next();
  }
};
