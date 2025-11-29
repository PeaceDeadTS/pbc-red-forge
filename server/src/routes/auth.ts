import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import type { SignOptions } from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { pool } from '../config/database.js';
import { jwtConfig } from '../config/jwt.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import crypto from 'crypto';

const router = Router();

// Схемы валидации
const registerSchema = z.object({
  username: z.string().min(3).max(50).regex(/^[a-zA-Z0-9_]+$/, 'Только буквы, цифры и _'),
  email: z.string().email('Некорректный email'),
  password: z.string().min(8, 'Минимум 8 символов'),
  display_name: z.string().max(100).optional(),
});

const loginSchema = z.object({
  login: z.string().min(1, 'Введите логин или email'),
  password: z.string().min(1, 'Введите пароль'),
  remember_me: z.boolean().optional().default(false),
});

// Helper: assign user to a group
async function assignUserToGroup(userId: string, groupName: string, assignedBy?: string): Promise<void> {
  const [groups] = await pool.execute<RowDataPacket[]>(
    'SELECT id FROM user_groups WHERE name = ?',
    [groupName]
  );
  if (groups.length > 0) {
    await pool.execute(
      'INSERT IGNORE INTO user_group_membership (user_id, group_id, assigned_by) VALUES (?, ?, ?)',
      [userId, groups[0].id, assignedBy || null]
    );
  }
}

// Helper: get user groups
async function getUserGroups(userId: string): Promise<string[]> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT ug.name FROM user_groups ug
     JOIN user_group_membership ugm ON ug.id = ugm.group_id
     WHERE ugm.user_id = ?`,
    [userId]
  );
  return rows.map((r: RowDataPacket) => r.name as string);
}

// Регистрация
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const data = registerSchema.parse(req.body);

    // Проверяем уникальность username и email
    const [existing] = await pool.execute<RowDataPacket[]>(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [data.username, data.email]
    );

    if (existing.length > 0) {
      res.status(400).json({ error: 'Пользователь с таким username или email уже существует' });
      return;
    }

    // Check if this is the first user (will become administrator)
    const [userCount] = await pool.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as count FROM users'
    );
    const isFirstUser = userCount[0].count === 0;

    // Хешируем пароль
    const passwordHash = await bcrypt.hash(data.password, 12);
    const userId = uuidv4();

    // Создаём пользователя
    await pool.execute<ResultSetHeader>(
      `INSERT INTO users (id, username, email, password_hash, display_name) VALUES (?, ?, ?, ?, ?)`,
      [userId, data.username, data.email, passwordHash, data.display_name || data.username]
    );

    // Assign user to groups
    if (isFirstUser) {
      // First user becomes administrator
      await assignUserToGroup(userId, 'administrator');
      await assignUserToGroup(userId, 'creator');
      await assignUserToGroup(userId, 'user');
    } else {
      // Regular users get 'user' group
      await assignUserToGroup(userId, 'user');
    }

    // Get assigned groups
    const groups = await getUserGroups(userId);

    // Создаём сессию
    const sessionId = uuidv4();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 1 день

    const token = jwt.sign(
      { userId, sessionId },
      jwtConfig.secret,
      { expiresIn: jwtConfig.expiresIn }
    );

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    await pool.execute<ResultSetHeader>(
      `INSERT INTO sessions (id, user_id, token_hash, expires_at, user_agent, ip_address) VALUES (?, ?, ?, ?, ?, ?)`,
      [sessionId, userId, tokenHash, expiresAt, req.headers['user-agent'] || null, req.ip || null]
    );

    res.status(201).json({
      message: 'Регистрация успешна',
      token,
      user: {
        id: userId,
        username: data.username,
        email: data.email,
        display_name: data.display_name || data.username,
        avatar_url: null,
        bio: null,
        groups,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Ошибка валидации', details: error.errors });
      return;
    }
    console.error('Ошибка регистрации:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Вход
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const data = loginSchema.parse(req.body);

    // Ищем пользователя по username или email
    const [users] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM users WHERE username = ? OR email = ?',
      [data.login, data.login]
    );

    if (users.length === 0) {
      res.status(401).json({ error: 'Неверный логин или пароль' });
      return;
    }

    const user = users[0];

    // Проверяем пароль
    const validPassword = await bcrypt.compare(data.password, user.password_hash);
    if (!validPassword) {
      res.status(401).json({ error: 'Неверный логин или пароль' });
      return;
    }

    // Создаём сессию
    const sessionId = uuidv4();
    const expiresIn = data.remember_me ? jwtConfig.rememberExpiresIn : jwtConfig.expiresIn;

    // Парсим время жизни токена
    const expiresMs = parseExpiration(expiresIn);
    const expiresAt = new Date(Date.now() + expiresMs);

    const token = jwt.sign(
      { userId: user.id, sessionId },
      jwtConfig.secret,
      { expiresIn }
    );

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    await pool.execute<ResultSetHeader>(
      `INSERT INTO sessions (id, user_id, token_hash, expires_at, user_agent, ip_address) VALUES (?, ?, ?, ?, ?, ?)`,
      [sessionId, user.id, tokenHash, expiresAt, req.headers['user-agent'] || null, req.ip || null]
    );

    // Get user groups
    const groups = await getUserGroups(user.id);

    res.json({
      message: 'Вход выполнен',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        display_name: user.display_name,
        avatar_url: user.avatar_url,
        bio: user.bio,
        groups,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Ошибка валидации', details: error.errors });
      return;
    }
    console.error('Ошибка входа:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Выход
router.post('/logout', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Не авторизован' });
      return;
    }

    // Удаляем текущую сессию
    await pool.execute<ResultSetHeader>(
      'DELETE FROM sessions WHERE id = ?',
      [req.user.sessionId]
    );

    res.json({ message: 'Выход выполнен' });
  } catch (error) {
    console.error('Ошибка выхода:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Выход со всех устройств
router.post('/logout-all', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Не авторизован' });
      return;
    }

    await pool.execute<ResultSetHeader>(
      'DELETE FROM sessions WHERE user_id = ?',
      [req.user.id]
    );

    res.json({ message: 'Выход со всех устройств выполнен' });
  } catch (error) {
    console.error('Ошибка выхода:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Текущий пользователь
router.get('/me', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Не авторизован' });
      return;
    }

    const [users] = await pool.execute<RowDataPacket[]>(
      'SELECT id, username, email, display_name, avatar_url, bio, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      res.status(404).json({ error: 'Пользователь не найден' });
      return;
    }

    // Get user groups
    const groups = await getUserGroups(req.user.id);

    res.json({ user: { ...users[0], groups } });
  } catch (error) {
    console.error('Ошибка получения пользователя:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Вспомогательная функция для парсинга времени жизни токена
function parseExpiration(exp: SignOptions['expiresIn']): number {
  // Если указано числом (секунды) — конвертируем в миллисекунды
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

export default router;
