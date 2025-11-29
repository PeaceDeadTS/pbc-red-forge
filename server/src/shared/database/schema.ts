import { pool } from './pool.js';
import { RowDataPacket } from 'mysql2';

// Default user groups with their rights
const DEFAULT_GROUPS = [
  {
    name: 'administrator',
    display_name: 'Administrator',
    // Administrators have all rights (wildcard)
    rights: ['*'],
  },
  {
    name: 'creator',
    display_name: 'Creator',
    rights: [
      'read_content',
      'comment',
      'like',
      'edit_own_profile',
      'create_content',
      'edit_own_content',
      'delete_own_content',
      'upload_files',
      'publish_content',
    ],
  },
  {
    name: 'user',
    display_name: 'User',
    rights: [
      'read_content',
      'comment',
      'like',
      'edit_own_profile',
    ],
  },
];

// All available rights in the system
const ALL_RIGHTS = [
  // Content rights
  'create_content',
  'edit_own_content',
  'edit_any_content',
  'delete_own_content',
  'delete_any_content',
  'upload_files',
  'publish_content',
  // User rights
  'read_content',
  'comment',
  'like',
  'edit_own_profile',
  // Admin rights
  'manage_users',
  'manage_groups',
  'manage_rights',
  'view_admin_panel',
  // Wildcard (all rights)
  '*',
];

/**
 * Ensure core database schema exists.
 * Idempotent: uses CREATE TABLE IF NOT EXISTS for all tables.
 */
export const ensureSchema = async (): Promise<void> => {
  // Users table
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(36) PRIMARY KEY,
      username VARCHAR(50) UNIQUE NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      display_name VARCHAR(100),
      avatar_url VARCHAR(500),
      bio TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_username (username),
      INDEX idx_email (email)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // Sessions table
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS sessions (
      id VARCHAR(36) PRIMARY KEY,
      user_id VARCHAR(36) NOT NULL,
      token_hash VARCHAR(255) NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      user_agent VARCHAR(500),
      ip_address VARCHAR(45),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_user_id (user_id),
      INDEX idx_expires_at (expires_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // User groups table (roles like administrator, creator, user)
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS user_groups (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(50) UNIQUE NOT NULL,
      display_name VARCHAR(100) NOT NULL,
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_name (name)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // Available rights in the system
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS user_rights (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(50) UNIQUE NOT NULL,
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_name (name)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // Rights assigned to groups
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS user_group_rights (
      group_id INT NOT NULL,
      right_id INT NOT NULL,
      PRIMARY KEY (group_id, right_id),
      FOREIGN KEY (group_id) REFERENCES user_groups(id) ON DELETE CASCADE,
      FOREIGN KEY (right_id) REFERENCES user_rights(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // User membership in groups (many-to-many)
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS user_group_membership (
      user_id VARCHAR(36) NOT NULL,
      group_id INT NOT NULL,
      assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      assigned_by VARCHAR(36),
      PRIMARY KEY (user_id, group_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (group_id) REFERENCES user_groups(id) ON DELETE CASCADE,
      FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL,
      INDEX idx_user_id (user_id),
      INDEX idx_group_id (group_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // Seed default rights
  for (const right of ALL_RIGHTS) {
    await pool.execute(
      `INSERT IGNORE INTO user_rights (name) VALUES (?)`,
      [right]
    );
  }

  // Seed default groups and their rights
  for (const group of DEFAULT_GROUPS) {
    // Insert group if not exists
    await pool.execute(
      `INSERT IGNORE INTO user_groups (name, display_name) VALUES (?, ?)`,
      [group.name, group.display_name]
    );

    // Get group ID
    const [groups] = await pool.execute<RowDataPacket[]>(
      `SELECT id FROM user_groups WHERE name = ?`,
      [group.name]
    );
    const groupId = groups[0]?.id;
    if (!groupId) continue;

    // Assign rights to group
    for (const rightName of group.rights) {
      const [rights] = await pool.execute<RowDataPacket[]>(
        `SELECT id FROM user_rights WHERE name = ?`,
        [rightName]
      );
      const rightId = rights[0]?.id;
      if (rightId) {
        await pool.execute(
          `INSERT IGNORE INTO user_group_rights (group_id, right_id) VALUES (?, ?)`,
          [groupId, rightId]
        );
      }
    }
  }
};
