import { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Heart, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { reactionsApi } from '@/lib/api';
import type { ReactionStats, ReactionTargetType, ReactionType } from '@/types/reaction';

export interface ReactionButtonProps {
  targetType: ReactionTargetType;
  targetId: string;
  initialStats?: ReactionStats | null;
  size?: 'sm' | 'default' | 'lg' | 'icon';
  variant?: 'default' | 'outline' | 'ghost';
  showCount?: boolean;
  className?: string;
  onStatsChange?: (stats: ReactionStats) => void;
}

/**
 * Reusable reaction button component
 * Can be used for articles, models, comments, etc.
 */
export function ReactionButton({
  targetType,
  targetId,
  initialStats,
  size = 'sm',
  variant = 'ghost',
  showCount = true,
  className,
  onStatsChange,
}: ReactionButtonProps) {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const [stats, setStats] = useState<ReactionStats | null>(initialStats || null);
  const [isToggling, setIsToggling] = useState(false);
  const [isLoading, setIsLoading] = useState(!initialStats);

  // Fetch stats on mount if not provided
  const fetchStats = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await reactionsApi.getStats({ target_type: targetType, target_id: targetId });
      setStats(res.data);
    } catch (err) {
      console.error('Failed to fetch reaction stats:', err);
    } finally {
      setIsLoading(false);
    }
  }, [targetType, targetId]);

  // Fetch on mount if no initial stats
  useEffect(() => {
    if (!initialStats) {
      fetchStats();
    }
  }, [initialStats, fetchStats]);

  const handleToggle = async () => {
    if (!isAuthenticated) {
      // Could show auth modal here
      return;
    }

    try {
      setIsToggling(true);
      const res = await reactionsApi.toggle({
        target_type: targetType,
        target_id: targetId,
        reaction_type: 'like',
      });
      setStats(res.data.stats);
      onStatsChange?.(res.data.stats);
    } catch (err) {
      console.error('Failed to toggle reaction:', err);
    } finally {
      setIsToggling(false);
    }
  };

  const isLiked = stats?.user_reaction === 'like';
  const likeCount = stats?.counts?.like || 0;

  const buttonContent = (
    <Button
      variant={variant}
      size={size}
      onClick={handleToggle}
      disabled={isToggling || isLoading}
      className={cn(
        'gap-1.5 transition-colors',
        isLiked && 'text-red-500 hover:text-red-600',
        !isAuthenticated && 'cursor-not-allowed opacity-70',
        className
      )}
    >
      {isToggling ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Heart
          className={cn(
            'h-4 w-4 transition-all',
            isLiked && 'fill-current'
          )}
        />
      )}
      {showCount && <span>{likeCount}</span>}
    </Button>
  );

  if (!isAuthenticated) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          {buttonContent}
        </TooltipTrigger>
        <TooltipContent>
          <p>{t('reactions.signInToLike')}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return buttonContent;
}

export default ReactionButton;
