import { Router, Request, Response } from 'express';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import { pool } from '../config/database.js';
import { authMiddleware, optionalAuthMiddleware, AuthRequest } from '../middleware/auth.js';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

const router = Router();

// Схема обновления профиля
const updateProfileSchema = z.object({
  display_name: z.string().max(100).optional(),
  bio: z.string().max(1000).optional(),
  avatar_url: z.string().url().max(500).optional().nullable(),
});

const changePasswordSchema = z.object({
  current_password: z.string().min(1),
  new_password: z.string().min(8),
});

// Получить профиль пользователя по ID
router.get('/:id', optionalAuthMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const [users] = await pool.execute<RowDataPacket[]>(
      'SELECT id, username, display_name, avatar_url, bio, created_at FROM users WHERE id = ?',
      [id]
    );

    if (users.length === 0) {
      res.status(404).json({ error: 'Пользователь не найден' });
      return;
    }

    const user = users[0];
    const isOwner = req.user?.id === id;

    // Если это владелец профиля, добавляем email
    if (isOwner) {
      const [fullUser] = await pool.execute<RowDataPacket[]>(
        'SELECT email FROM users WHERE id = ?',
        [id]
      );
      user.email = fullUser[0]?.email;
    }

    res.json({ user, isOwner });
  } catch (error) {
    console.error('Ошибка получения профиля:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Обновить свой профиль
router.patch('/me', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Не авторизован' });
      return;
    }

    const data = updateProfileSchema.parse(req.body);

    const updates: string[] = [];
    const values: (string | null)[] = [];

    if (data.display_name !== undefined) {
      updates.push('display_name = ?');
      values.push(data.display_name);
    }
    if (data.bio !== undefined) {
      updates.push('bio = ?');
      values.push(data.bio);
    }
    if (data.avatar_url !== undefined) {
      updates.push('avatar_url = ?');
      values.push(data.avatar_url);
    }

    if (updates.length === 0) {
      res.status(400).json({ error: 'Нет данных для обновления' });
      return;
    }

    values.push(req.user.id);

    await pool.execute<ResultSetHeader>(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    // Возвращаем обновлённые данные
    const [users] = await pool.execute<RowDataPacket[]>(
      'SELECT id, username, email, display_name, avatar_url, bio, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    res.json({ user: users[0] });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Ошибка валидации', details: error.errors });
      return;
    }
    console.error('Ошибка обновления профиля:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Сменить пароль
router.post('/me/change-password', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Не авторизован' });
      return;
    }

    const data = changePasswordSchema.parse(req.body);

    // Получаем текущий хеш пароля
    const [users] = await pool.execute<RowDataPacket[]>(
      'SELECT password_hash FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      res.status(404).json({ error: 'Пользователь не найден' });
      return;
    }

    // Проверяем текущий пароль
    const validPassword = await bcrypt.compare(data.current_password, users[0].password_hash);
    if (!validPassword) {
      res.status(400).json({ error: 'Неверный текущий пароль' });
      return;
    }

    // Хешируем новый пароль
    const newPasswordHash = await bcrypt.hash(data.new_password, 12);

    await pool.execute<ResultSetHeader>(
      'UPDATE users SET password_hash = ? WHERE id = ?',
      [newPasswordHash, req.user.id]
    );

    // Удаляем все сессии кроме текущей
    await pool.execute<ResultSetHeader>(
      'DELETE FROM sessions WHERE user_id = ? AND id != ?',
      [req.user.id, req.user.sessionId]
    );

    res.json({ message: 'Пароль успешно изменён' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Ошибка валидации', details: error.errors });
      return;
    }
    console.error('Ошибка смены пароля:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

export default router;
