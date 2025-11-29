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

const updateUserGroupsSchema = z.object({
  groups: z.array(z.string()),
});

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

// Helper: check if user has a specific right
async function userHasRight(userId: string, rightName: string): Promise<boolean> {
  // Get all rights for user's groups
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT DISTINCT ur.name FROM user_rights ur
     JOIN user_group_rights ugr ON ur.id = ugr.right_id
     JOIN user_group_membership ugm ON ugr.group_id = ugm.group_id
     WHERE ugm.user_id = ?`,
    [userId]
  );
  const rights = rows.map((r: RowDataPacket) => r.name as string);
  // Wildcard '*' means all rights
  return rights.includes('*') || rights.includes(rightName);
}

// Helper: check if user is administrator
async function isAdmin(userId: string): Promise<boolean> {
  const groups = await getUserGroups(userId);
  return groups.includes('administrator');
}

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

// Get list of all users (public endpoint)
router.get('/', optionalAuthMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { sort = 'created_at', order = 'desc', limit = '50', offset = '0' } = req.query as Record<string, string>;

    // Validate sort field
    const allowedSortFields = ['created_at', 'username', 'display_name'];
    const sortField = allowedSortFields.includes(sort) ? sort : 'created_at';
    const sortOrder = order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 100);
    const offsetNum = Math.max(parseInt(offset, 10) || 0, 0);

    // Get total count
    const [countResult] = await pool.execute<RowDataPacket[]>('SELECT COUNT(*) as total FROM users');
    const total = countResult[0].total;

    // Get users
    const [users] = await pool.execute<RowDataPacket[]>(
      `SELECT id, username, display_name, avatar_url, bio, created_at FROM users ORDER BY ${sortField} ${sortOrder} LIMIT ? OFFSET ?`,
      [limitNum, offsetNum]
    );

    // Get groups for each user
    const usersWithGroups = await Promise.all(
      users.map(async (user: RowDataPacket) => {
        const groups = await getUserGroups(user.id);
        return { ...user, groups };
      })
    );

    res.json({
      users: usersWithGroups,
      pagination: {
        total,
        limit: limitNum,
        offset: offsetNum,
      },
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Get all available groups
router.get('/groups/list', async (_req: Request, res: Response): Promise<void> => {
  try {
    const [groups] = await pool.execute<RowDataPacket[]>(
      'SELECT id, name, display_name, description FROM user_groups ORDER BY name'
    );
    res.json({ groups });
  } catch (error) {
    console.error('Error fetching groups:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Update user groups (admin only)
router.patch('/:id/groups', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Не авторизован' });
      return;
    }

    // Check if current user is admin
    const adminCheck = await isAdmin(req.user.id);
    if (!adminCheck) {
      res.status(403).json({ error: 'Недостаточно прав' });
      return;
    }

    const { id } = req.params;
    const data = updateUserGroupsSchema.parse(req.body);

    // Check if target user exists
    const [targetUsers] = await pool.execute<RowDataPacket[]>(
      'SELECT id FROM users WHERE id = ?',
      [id]
    );
    if (targetUsers.length === 0) {
      res.status(404).json({ error: 'Пользователь не найден' });
      return;
    }

    // Get valid group IDs
    const [validGroups] = await pool.execute<RowDataPacket[]>(
      'SELECT id, name FROM user_groups WHERE name IN (?)',
      [data.groups.length > 0 ? data.groups : ['']]
    );
    const validGroupMap = new Map(validGroups.map((g: RowDataPacket) => [g.name, g.id]));

    // Remove all current group memberships
    await pool.execute('DELETE FROM user_group_membership WHERE user_id = ?', [id]);

    // Add new group memberships
    for (const groupName of data.groups) {
      const groupId = validGroupMap.get(groupName);
      if (groupId) {
        await pool.execute(
          'INSERT INTO user_group_membership (user_id, group_id, assigned_by) VALUES (?, ?, ?)',
          [id, groupId, req.user.id]
        );
      }
    }

    // Get updated groups
    const updatedGroups = await getUserGroups(id);

    res.json({ groups: updatedGroups });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Ошибка валидации', details: error.errors });
      return;
    }
    console.error('Error updating user groups:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

export default router;
