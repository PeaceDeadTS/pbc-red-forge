import { pool } from '../../shared/index.js';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export interface UserRow extends RowDataPacket {
  id: string;
  username: string;
  email: string;
  password_hash: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface GroupRow extends RowDataPacket {
  id: number;
  name: string;
  display_name: string;
  description: string | null;
}

export interface CountRow extends RowDataPacket {
  total: number;
}

export const usersRepository = {
  /**
   * Find user by ID (public fields only)
   */
  async findById(id: string): Promise<UserRow | null> {
    const [users] = await pool.execute<UserRow[]>(
      'SELECT id, username, display_name, avatar_url, bio, created_at FROM users WHERE id = ?',
      [id]
    );
    return users[0] || null;
  },

  /**
   * Find user by ID with email
   */
  async findByIdWithEmail(id: string): Promise<UserRow | null> {
    const [users] = await pool.execute<UserRow[]>(
      'SELECT id, username, email, display_name, avatar_url, bio, created_at FROM users WHERE id = ?',
      [id]
    );
    return users[0] || null;
  },

  /**
   * Find user by ID with password hash
   */
  async findByIdWithPassword(id: string): Promise<UserRow | null> {
    const [users] = await pool.execute<UserRow[]>(
      'SELECT id, password_hash FROM users WHERE id = ?',
      [id]
    );
    return users[0] || null;
  },

  /**
   * Update user profile
   */
  async updateProfile(
    userId: string,
    data: { display_name?: string; bio?: string; avatar_url?: string | null }
  ): Promise<void> {
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

    if (updates.length === 0) return;

    values.push(userId);
    await pool.execute<ResultSetHeader>(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      values
    );
  },

  /**
   * Update user password
   */
  async updatePassword(userId: string, passwordHash: string): Promise<void> {
    await pool.execute<ResultSetHeader>(
      'UPDATE users SET password_hash = ? WHERE id = ?',
      [passwordHash, userId]
    );
  },

  /**
   * Delete all sessions except current
   */
  async deleteOtherSessions(userId: string, currentSessionId: string): Promise<void> {
    await pool.execute<ResultSetHeader>(
      'DELETE FROM sessions WHERE user_id = ? AND id != ?',
      [userId, currentSessionId]
    );
  },

  /**
   * Get users list with pagination
   */
  async getUsers(options: {
    sortField: string;
    sortOrder: 'ASC' | 'DESC';
    limit: number;
    offset: number;
  }): Promise<UserRow[]> {
    const [users] = await pool.execute<UserRow[]>(
      `SELECT id, username, display_name, avatar_url, bio, created_at FROM users ORDER BY ${options.sortField} ${options.sortOrder} LIMIT ? OFFSET ?`,
      [options.limit, options.offset]
    );
    return users;
  },

  /**
   * Get total users count
   */
  async getTotalCount(): Promise<number> {
    const [result] = await pool.execute<CountRow[]>('SELECT COUNT(*) as total FROM users');
    return result[0].total;
  },

  /**
   * Get user groups
   */
  async getUserGroups(userId: string): Promise<string[]> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT ug.name FROM user_groups ug
       JOIN user_group_membership ugm ON ug.id = ugm.group_id
       WHERE ugm.user_id = ?`,
      [userId]
    );
    return rows.map((r: RowDataPacket) => r.name as string);
  },

  async getUserRights(userId: string): Promise<string[]> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT DISTINCT ur.name
       FROM user_rights ur
       JOIN user_group_rights ugr ON ur.id = ugr.right_id
       JOIN user_group_membership ugm ON ugm.group_id = ugr.group_id
       WHERE ugm.user_id = ?`,
      [userId]
    );
    return rows.map((r: RowDataPacket) => r.name as string);
  },

  /**
   * Get all available groups
   */
  async getAllGroups(): Promise<GroupRow[]> {
    const [groups] = await pool.execute<GroupRow[]>(
      'SELECT id, name, display_name, description FROM user_groups ORDER BY name'
    );
    return groups;
  },

  /**
   * Get groups by names
   */
  async getGroupsByNames(names: string[]): Promise<GroupRow[]> {
    if (names.length === 0) return [];
    const placeholders = names.map(() => '?').join(',');
    const [groups] = await pool.execute<GroupRow[]>(
      `SELECT id, name FROM user_groups WHERE name IN (${placeholders})`,
      names
    );
    return groups;
  },

  /**
   * Remove all group memberships for user
   */
  async removeAllGroupMemberships(userId: string): Promise<void> {
    await pool.execute('DELETE FROM user_group_membership WHERE user_id = ?', [userId]);
  },

  /**
   * Add user to group
   */
  async addUserToGroup(userId: string, groupId: number, assignedBy: string): Promise<void> {
    await pool.execute(
      'INSERT INTO user_group_membership (user_id, group_id, assigned_by) VALUES (?, ?, ?)',
      [userId, groupId, assignedBy]
    );
  },

  /**
   * Check if user exists
   */
  async exists(userId: string): Promise<boolean> {
    const [users] = await pool.execute<RowDataPacket[]>(
      'SELECT id FROM users WHERE id = ?',
      [userId]
    );
    return users.length > 0;
  },
};
