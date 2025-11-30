import { pool } from '../../shared/database/pool.js';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { v4 as uuidv4 } from 'uuid';
import {
  ReactionRow,
  ReactionTargetTypeValue,
  ReactionTypeValue,
} from './reactions.types.js';

interface ReactionRowData extends RowDataPacket, ReactionRow {}

interface CountRow extends RowDataPacket {
  reaction_type: ReactionTypeValue;
  count: number;
}

interface TotalRow extends RowDataPacket {
  total: number;
}

export const reactionsRepository = {
  /**
   * Find a specific reaction by user and target
   */
  async findByUserAndTarget(
    userId: string,
    targetType: ReactionTargetTypeValue,
    targetId: string,
    reactionType: ReactionTypeValue
  ): Promise<ReactionRow | null> {
    const [rows] = await pool.execute<ReactionRowData[]>(
      `SELECT * FROM reactions 
       WHERE user_id = ? AND target_type = ? AND target_id = ? AND reaction_type = ?`,
      [userId, targetType, targetId, reactionType]
    );
    return rows[0] || null;
  },

  /**
   * Find user's reaction on a target (any type)
   */
  async findUserReactionOnTarget(
    userId: string,
    targetType: ReactionTargetTypeValue,
    targetId: string
  ): Promise<ReactionRow | null> {
    const [rows] = await pool.execute<ReactionRowData[]>(
      `SELECT * FROM reactions 
       WHERE user_id = ? AND target_type = ? AND target_id = ?`,
      [userId, targetType, targetId]
    );
    return rows[0] || null;
  },

  /**
   * Create a new reaction
   */
  async create(
    userId: string,
    targetType: ReactionTargetTypeValue,
    targetId: string,
    reactionType: ReactionTypeValue
  ): Promise<ReactionRow> {
    const id = uuidv4();
    await pool.execute<ResultSetHeader>(
      `INSERT INTO reactions (id, user_id, target_type, target_id, reaction_type)
       VALUES (?, ?, ?, ?, ?)`,
      [id, userId, targetType, targetId, reactionType]
    );

    const created = await this.findByUserAndTarget(userId, targetType, targetId, reactionType);
    return created!;
  },

  /**
   * Delete a reaction
   */
  async delete(
    userId: string,
    targetType: ReactionTargetTypeValue,
    targetId: string,
    reactionType: ReactionTypeValue
  ): Promise<boolean> {
    const [result] = await pool.execute<ResultSetHeader>(
      `DELETE FROM reactions 
       WHERE user_id = ? AND target_type = ? AND target_id = ? AND reaction_type = ?`,
      [userId, targetType, targetId, reactionType]
    );
    return result.affectedRows > 0;
  },

  /**
   * Get reaction counts for a target
   */
  async getCountsByTarget(
    targetType: ReactionTargetTypeValue,
    targetId: string
  ): Promise<Record<ReactionTypeValue, number>> {
    const [rows] = await pool.execute<CountRow[]>(
      `SELECT reaction_type, COUNT(*) as count 
       FROM reactions 
       WHERE target_type = ? AND target_id = ?
       GROUP BY reaction_type`,
      [targetType, targetId]
    );

    const counts: Record<string, number> = { like: 0 };
    for (const row of rows) {
      counts[row.reaction_type] = row.count;
    }
    return counts as Record<ReactionTypeValue, number>;
  },

  /**
   * Get total reaction count for a target
   */
  async getTotalByTarget(
    targetType: ReactionTargetTypeValue,
    targetId: string
  ): Promise<number> {
    const [rows] = await pool.execute<TotalRow[]>(
      `SELECT COUNT(*) as total 
       FROM reactions 
       WHERE target_type = ? AND target_id = ?`,
      [targetType, targetId]
    );
    return rows[0]?.total || 0;
  },

  /**
   * Get user's reactions with pagination
   */
  async getUserReactions(
    userId: string,
    targetType?: ReactionTargetTypeValue,
    limit: number = 50,
    offset: number = 0
  ): Promise<{ reactions: ReactionRow[]; total: number }> {
    let query = `SELECT * FROM reactions WHERE user_id = ?`;
    let countQuery = `SELECT COUNT(*) as total FROM reactions WHERE user_id = ?`;
    const params: (string | number)[] = [userId];

    if (targetType) {
      query += ` AND target_type = ?`;
      countQuery += ` AND target_type = ?`;
      params.push(targetType);
    }

    query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;

    const [rows] = await pool.execute<ReactionRowData[]>(query, [...params, limit, offset]);
    const [countRows] = await pool.execute<TotalRow[]>(countQuery, params);

    return {
      reactions: rows,
      total: countRows[0]?.total || 0,
    };
  },

  /**
   * Get batch reaction stats for multiple targets
   */
  async getBatchStats(
    targetType: ReactionTargetTypeValue,
    targetIds: string[],
    userId?: string
  ): Promise<Map<string, { counts: Record<ReactionTypeValue, number>; userReaction: ReactionTypeValue | null }>> {
    if (targetIds.length === 0) {
      return new Map();
    }

    const placeholders = targetIds.map(() => '?').join(',');

    // Get counts
    const [countRows] = await pool.execute<(CountRow & { target_id: string })[]>(
      `SELECT target_id, reaction_type, COUNT(*) as count 
       FROM reactions 
       WHERE target_type = ? AND target_id IN (${placeholders})
       GROUP BY target_id, reaction_type`,
      [targetType, ...targetIds]
    );

    // Get user reactions if userId provided
    let userReactions: Map<string, ReactionTypeValue> = new Map();
    if (userId) {
      const [userRows] = await pool.execute<ReactionRowData[]>(
        `SELECT target_id, reaction_type 
         FROM reactions 
         WHERE user_id = ? AND target_type = ? AND target_id IN (${placeholders})`,
        [userId, targetType, ...targetIds]
      );
      for (const row of userRows) {
        userReactions.set(row.target_id, row.reaction_type);
      }
    }

    // Build result map
    const result = new Map<string, { counts: Record<ReactionTypeValue, number>; userReaction: ReactionTypeValue | null }>();
    
    // Initialize all targets
    for (const id of targetIds) {
      result.set(id, { counts: { like: 0 }, userReaction: userReactions.get(id) || null });
    }

    // Fill in counts
    for (const row of countRows) {
      const entry = result.get(row.target_id);
      if (entry) {
        entry.counts[row.reaction_type] = row.count;
      }
    }

    return result;
  },
};
