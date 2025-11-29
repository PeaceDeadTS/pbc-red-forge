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

export interface SessionRow extends RowDataPacket {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: Date;
  created_at: Date;
  user_agent: string | null;
  ip_address: string | null;
}

export interface GroupRow extends RowDataPacket {
  id: number;
  name: string;
  display_name: string;
}

export interface CountRow extends RowDataPacket {
  count: number;
}

export const authRepository = {
  /**
   * Find user by username or email
   */
  async findByUsernameOrEmail(login: string): Promise<UserRow | null> {
    const [users] = await pool.execute<UserRow[]>(
      'SELECT * FROM users WHERE username = ? OR email = ?',
      [login, login]
    );
    return users[0] || null;
  },

  /**
   * Check if username or email already exists
   */
  async existsByUsernameOrEmail(username: string, email: string): Promise<boolean> {
    const [existing] = await pool.execute<RowDataPacket[]>(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [username, email]
    );
    return existing.length > 0;
  },

  /**
   * Get total user count
   */
  async getUserCount(): Promise<number> {
    const [result] = await pool.execute<CountRow[]>(
      'SELECT COUNT(*) as count FROM users'
    );
    return result[0].count;
  },

  /**
   * Create new user
   */
  async createUser(data: {
    id: string;
    username: string;
    email: string;
    passwordHash: string;
    displayName: string;
  }): Promise<void> {
    await pool.execute<ResultSetHeader>(
      `INSERT INTO users (id, username, email, password_hash, display_name) VALUES (?, ?, ?, ?, ?)`,
      [data.id, data.username, data.email, data.passwordHash, data.displayName]
    );
  },

  /**
   * Find user by ID
   */
  async findById(id: string): Promise<UserRow | null> {
    const [users] = await pool.execute<UserRow[]>(
      'SELECT id, username, email, display_name, avatar_url, bio, created_at FROM users WHERE id = ?',
      [id]
    );
    return users[0] || null;
  },

  /**
   * Create session
   */
  async createSession(data: {
    id: string;
    userId: string;
    tokenHash: string;
    expiresAt: Date;
    userAgent: string | null;
    ipAddress: string | null;
  }): Promise<void> {
    await pool.execute<ResultSetHeader>(
      `INSERT INTO sessions (id, user_id, token_hash, expires_at, user_agent, ip_address) VALUES (?, ?, ?, ?, ?, ?)`,
      [data.id, data.userId, data.tokenHash, data.expiresAt, data.userAgent, data.ipAddress]
    );
  },

  /**
   * Delete session by ID
   */
  async deleteSession(sessionId: string): Promise<void> {
    await pool.execute<ResultSetHeader>(
      'DELETE FROM sessions WHERE id = ?',
      [sessionId]
    );
  },

  /**
   * Delete all sessions for user
   */
  async deleteAllUserSessions(userId: string): Promise<void> {
    await pool.execute<ResultSetHeader>(
      'DELETE FROM sessions WHERE user_id = ?',
      [userId]
    );
  },

  /**
   * Get group by name
   */
  async getGroupByName(name: string): Promise<GroupRow | null> {
    const [groups] = await pool.execute<GroupRow[]>(
      'SELECT id FROM user_groups WHERE name = ?',
      [name]
    );
    return groups[0] || null;
  },

  /**
   * Assign user to group
   */
  async assignUserToGroup(userId: string, groupId: number, assignedBy?: string): Promise<void> {
    await pool.execute(
      'INSERT IGNORE INTO user_group_membership (user_id, group_id, assigned_by) VALUES (?, ?, ?)',
      [userId, groupId, assignedBy || null]
    );
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
};
