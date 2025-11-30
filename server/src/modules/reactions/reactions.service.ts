import { reactionsRepository } from './reactions.repository.js';
import {
  ReactionsError,
  ReactionStats,
  ReactionToggleResponse,
  ReactionTargetTypeValue,
  ReactionTypeValue,
  BatchReactionStats,
  UserReactionItem,
} from './reactions.types.js';

export const reactionsService = {
  /**
   * Toggle a reaction (add if not exists, remove if exists)
   */
  async toggleReaction(
    userId: string,
    targetType: ReactionTargetTypeValue,
    targetId: string,
    reactionType: ReactionTypeValue
  ): Promise<ReactionToggleResponse> {
    // Check if reaction already exists
    const existing = await reactionsRepository.findByUserAndTarget(
      userId,
      targetType,
      targetId,
      reactionType
    );

    let action: 'added' | 'removed';

    if (existing) {
      // Remove reaction
      await reactionsRepository.delete(userId, targetType, targetId, reactionType);
      action = 'removed';
    } else {
      // Add reaction
      await reactionsRepository.create(userId, targetType, targetId, reactionType);
      action = 'added';
    }

    // Get updated stats
    const stats = await this.getStats(targetType, targetId, userId);

    return {
      action,
      reaction_type: reactionType,
      stats,
    };
  },

  /**
   * Get reaction stats for a target
   */
  async getStats(
    targetType: ReactionTargetTypeValue,
    targetId: string,
    userId?: string
  ): Promise<ReactionStats> {
    const counts = await reactionsRepository.getCountsByTarget(targetType, targetId);
    const total = Object.values(counts).reduce((sum, count) => sum + count, 0);

    let userReaction: ReactionTypeValue | null = null;
    if (userId) {
      const reaction = await reactionsRepository.findUserReactionOnTarget(userId, targetType, targetId);
      userReaction = reaction?.reaction_type || null;
    }

    return {
      target_type: targetType,
      target_id: targetId,
      counts,
      total,
      user_reaction: userReaction,
    };
  },

  /**
   * Get batch stats for multiple targets
   */
  async getBatchStats(
    targetType: ReactionTargetTypeValue,
    targetIds: string[],
    userId?: string
  ): Promise<BatchReactionStats> {
    const statsMap = await reactionsRepository.getBatchStats(targetType, targetIds, userId);

    const result: BatchReactionStats = {};
    for (const [targetId, data] of statsMap) {
      const total = Object.values(data.counts).reduce((sum, count) => sum + count, 0);
      result[targetId] = {
        target_type: targetType,
        target_id: targetId,
        counts: data.counts,
        total,
        user_reaction: data.userReaction,
      };
    }

    return result;
  },

  /**
   * Get user's reactions
   */
  async getUserReactions(
    userId: string,
    targetType?: ReactionTargetTypeValue,
    limit: number = 50,
    offset: number = 0
  ): Promise<{ reactions: UserReactionItem[]; total: number }> {
    const { reactions, total } = await reactionsRepository.getUserReactions(
      userId,
      targetType,
      limit,
      offset
    );

    return {
      reactions: reactions.map((r) => ({
        target_type: r.target_type,
        target_id: r.target_id,
        reaction_type: r.reaction_type,
        created_at: r.created_at,
      })),
      total,
    };
  },

  /**
   * Check if user has reacted to a target
   */
  async hasUserReacted(
    userId: string,
    targetType: ReactionTargetTypeValue,
    targetId: string
  ): Promise<boolean> {
    const reaction = await reactionsRepository.findUserReactionOnTarget(userId, targetType, targetId);
    return reaction !== null;
  },
};
