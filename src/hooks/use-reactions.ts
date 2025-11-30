import { useState, useCallback, useEffect } from 'react';
import { reactionsApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import type { ReactionStats, ReactionTargetType, ReactionType, BatchReactionStats } from '@/types/reaction';

interface UseReactionsOptions {
  targetType: ReactionTargetType;
  targetId: string;
  initialStats?: ReactionStats;
}

interface UseReactionsReturn {
  stats: ReactionStats | null;
  isLoading: boolean;
  isToggling: boolean;
  error: string | null;
  toggle: (reactionType?: ReactionType) => Promise<void>;
  refresh: () => Promise<void>;
}

/**
 * Hook for managing reactions on a single target
 */
export function useReactions({
  targetType,
  targetId,
  initialStats,
}: UseReactionsOptions): UseReactionsReturn {
  const { isAuthenticated } = useAuth();
  const [stats, setStats] = useState<ReactionStats | null>(initialStats || null);
  const [isLoading, setIsLoading] = useState(!initialStats);
  const [isToggling, setIsToggling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await reactionsApi.getStats({ target_type: targetType, target_id: targetId });
      setStats(res.data);
    } catch (err) {
      console.error('Failed to fetch reaction stats:', err);
      setError('Failed to load reactions');
    } finally {
      setIsLoading(false);
    }
  }, [targetType, targetId]);

  const toggle = useCallback(async (reactionType: ReactionType = 'like') => {
    if (!isAuthenticated) {
      setError('Please sign in to react');
      return;
    }

    try {
      setIsToggling(true);
      setError(null);
      const res = await reactionsApi.toggle({
        target_type: targetType,
        target_id: targetId,
        reaction_type: reactionType,
      });
      setStats(res.data.stats);
    } catch (err) {
      console.error('Failed to toggle reaction:', err);
      setError('Failed to update reaction');
    } finally {
      setIsToggling(false);
    }
  }, [isAuthenticated, targetType, targetId]);

  useEffect(() => {
    if (!initialStats) {
      fetchStats();
    }
  }, [fetchStats, initialStats]);

  return {
    stats,
    isLoading,
    isToggling,
    error,
    toggle,
    refresh: fetchStats,
  };
}

interface UseBatchReactionsOptions {
  targetType: ReactionTargetType;
  targetIds: string[];
  enabled?: boolean;
}

interface UseBatchReactionsReturn {
  stats: BatchReactionStats;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  updateStats: (targetId: string, newStats: ReactionStats) => void;
}

/**
 * Hook for fetching reactions for multiple targets at once
 */
export function useBatchReactions({
  targetType,
  targetIds,
  enabled = true,
}: UseBatchReactionsOptions): UseBatchReactionsReturn {
  const [stats, setStats] = useState<BatchReactionStats>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBatch = useCallback(async () => {
    if (targetIds.length === 0) {
      setStats({});
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const res = await reactionsApi.getBatch({
        target_type: targetType,
        target_ids: targetIds,
      });
      setStats(res.data);
    } catch (err) {
      console.error('Failed to fetch batch reaction stats:', err);
      setError('Failed to load reactions');
    } finally {
      setIsLoading(false);
    }
  }, [targetType, targetIds]);

  const updateStats = useCallback((targetId: string, newStats: ReactionStats) => {
    setStats((prev) => ({
      ...prev,
      [targetId]: newStats,
    }));
  }, []);

  useEffect(() => {
    if (enabled && targetIds.length > 0) {
      fetchBatch();
    }
  }, [enabled, fetchBatch, targetIds.length]);

  return {
    stats,
    isLoading,
    error,
    refresh: fetchBatch,
    updateStats,
  };
}
