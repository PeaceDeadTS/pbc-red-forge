import { z } from 'zod';

// Supported target types for reactions
export const ReactionTargetType = {
  ARTICLE: 'article',
  // Future: MODEL: 'model', COMMENT: 'comment', IMAGE: 'image'
} as const;

export type ReactionTargetTypeValue = (typeof ReactionTargetType)[keyof typeof ReactionTargetType];

// Supported reaction types
export const ReactionType = {
  LIKE: 'like',
  // Future: LOVE: 'love', FIRE: 'fire', etc.
} as const;

export type ReactionTypeValue = (typeof ReactionType)[keyof typeof ReactionType];

// Validation schemas
export const toggleReactionSchema = z.object({
  target_type: z.enum(['article']),
  target_id: z.string().uuid(),
  reaction_type: z.enum(['like']).default('like'),
});

export const getReactionsQuerySchema = z.object({
  target_type: z.enum(['article']),
  target_id: z.string().uuid(),
});

export const getUserReactionsQuerySchema = z.object({
  target_type: z.enum(['article']).optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
});

export const getBatchReactionsSchema = z.object({
  target_type: z.enum(['article']),
  target_ids: z.array(z.string().uuid()).min(1).max(50),
});

// Types inferred from schemas
export type ToggleReactionInput = z.infer<typeof toggleReactionSchema>;
export type GetReactionsQuery = z.infer<typeof getReactionsQuerySchema>;
export type GetUserReactionsQuery = z.infer<typeof getUserReactionsQuerySchema>;
export type GetBatchReactionsInput = z.infer<typeof getBatchReactionsSchema>;

// Database row type
export interface ReactionRow {
  id: string;
  user_id: string;
  target_type: ReactionTargetTypeValue;
  target_id: string;
  reaction_type: ReactionTypeValue;
  created_at: Date;
}

// Response types
export interface ReactionStats {
  target_type: ReactionTargetTypeValue;
  target_id: string;
  counts: Record<ReactionTypeValue, number>;
  total: number;
  user_reaction: ReactionTypeValue | null;
}

export interface ReactionToggleResponse {
  action: 'added' | 'removed';
  reaction_type: ReactionTypeValue;
  stats: ReactionStats;
}

export interface UserReactionItem {
  target_type: ReactionTargetTypeValue;
  target_id: string;
  reaction_type: ReactionTypeValue;
  created_at: Date;
}

export interface BatchReactionStats {
  [targetId: string]: ReactionStats;
}

// Error class for reactions module
export class ReactionsError extends Error {
  constructor(
    message: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'ReactionsError';
  }
}
