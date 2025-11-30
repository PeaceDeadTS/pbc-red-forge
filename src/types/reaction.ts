export type ReactionTargetType = 'article';
export type ReactionType = 'like';

export interface ReactionStats {
  target_type: ReactionTargetType;
  target_id: string;
  counts: Record<ReactionType, number>;
  total: number;
  user_reaction: ReactionType | null;
}

export interface ReactionToggleResponse {
  action: 'added' | 'removed';
  reaction_type: ReactionType;
  stats: ReactionStats;
}

export interface BatchReactionStats {
  [targetId: string]: ReactionStats;
}

export interface UserReactionItem {
  target_type: ReactionTargetType;
  target_id: string;
  reaction_type: ReactionType;
  created_at: string;
}

export interface ToggleReactionInput {
  target_type: ReactionTargetType;
  target_id: string;
  reaction_type?: ReactionType;
}

export interface GetBatchReactionsInput {
  target_type: ReactionTargetType;
  target_ids: string[];
}
