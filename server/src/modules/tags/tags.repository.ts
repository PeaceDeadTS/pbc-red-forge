import { pool } from '../../shared/index.js';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { v4 as uuidv4 } from 'uuid';
import { TagTargetTypeValue, TagWithCount } from './tags.types.js';

interface TagRow extends RowDataPacket {
  target_id: string;
  tag: string;
}

interface CountRow extends RowDataPacket {
  tag: string;
  count: number;
}

export const tagsRepository = {
  async setTags(targetType: TagTargetTypeValue, targetId: string, tags: string[]): Promise<void> {
    const normalized = Array.from(
      new Set(
        tags
          .map((t) => t.toLowerCase().trim())
          .filter((t) => t.length > 0)
      )
    );

    await pool.execute<ResultSetHeader>(
      `DELETE FROM tags WHERE target_type = ? AND target_id = ?`,
      [targetType, targetId]
    );

    if (normalized.length === 0) {
      return;
    }

    const values = normalized.map((tag) => [uuidv4(), targetType, targetId, tag]);
    const placeholders = values.map(() => '(?, ?, ?, ?)').join(', ');
    const flatValues = values.flat();

    await pool.execute<ResultSetHeader>(
      `INSERT IGNORE INTO tags (id, target_type, target_id, tag) VALUES ${placeholders}`,
      flatValues
    );
  },

  async getTags(targetType: TagTargetTypeValue, targetId: string): Promise<string[]> {
    const [rows] = await pool.execute<TagRow[]>(
      `SELECT target_id, tag FROM tags WHERE target_type = ? AND target_id = ? ORDER BY tag ASC`,
      [targetType, targetId]
    );

    return rows.map((r) => r.tag);
  },

  async getTagsForTargets(targetType: TagTargetTypeValue, targetIds: string[]): Promise<Map<string, string[]>> {
    if (targetIds.length === 0) {
      return new Map();
    }

    const placeholders = targetIds.map(() => '?').join(',');
    const [rows] = await pool.execute<TagRow[]>(
      `SELECT target_id, tag FROM tags WHERE target_type = ? AND target_id IN (${placeholders}) ORDER BY tag ASC`,
      [targetType, ...targetIds]
    );

    const result = new Map<string, string[]>();

    for (const row of rows) {
      const existing = result.get(row.target_id) || [];
      existing.push(row.tag);
      result.set(row.target_id, existing);
    }

    return result;
  },

  async deleteAllForTarget(targetType: TagTargetTypeValue, targetId: string): Promise<void> {
    await pool.execute<ResultSetHeader>(
      `DELETE FROM tags WHERE target_type = ? AND target_id = ?`,
      [targetType, targetId]
    );
  },

  async getAllTagsForArticles(): Promise<TagWithCount[]> {
    const [rows] = await pool.execute<CountRow[]>(
      `SELECT t.tag, COUNT(*) as count
       FROM tags t
       JOIN articles a ON t.target_id = a.id
       WHERE t.target_type = 'article' AND a.status = 'published'
       GROUP BY t.tag
       ORDER BY count DESC, t.tag ASC
       LIMIT 100`
    );

    return rows.map((r) => ({ tag: r.tag, count: Number(r.count) }));
  },
};
