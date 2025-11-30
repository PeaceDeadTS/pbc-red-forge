import { Router, Response } from 'express';
import { reactionsService } from './reactions.service.js';
import {
  toggleReactionSchema,
  getReactionsQuerySchema,
  getUserReactionsQuerySchema,
  getBatchReactionsSchema,
  ReactionsError,
} from './reactions.types.js';
import { authMiddleware, optionalAuthMiddleware, AuthRequest } from '../../shared/index.js';

const router = Router();

/**
 * POST /reactions/toggle
 * Toggle a reaction (add/remove)
 * Requires authentication
 */
router.post('/toggle', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const parsed = toggleReactionSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Validation error',
        details: parsed.error.flatten(),
      });
    }

    const { target_type, target_id, reaction_type } = parsed.data;
    const userId = req.user!.id;

    const result = await reactionsService.toggleReaction(
      userId,
      target_type,
      target_id,
      reaction_type
    );

    return res.json(result);
  } catch (error) {
    console.error('Toggle reaction error:', error);
    if (error instanceof ReactionsError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /reactions/stats
 * Get reaction stats for a target
 * Optional authentication (to get user's reaction)
 */
router.get('/stats', optionalAuthMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const parsed = getReactionsQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Validation error',
        details: parsed.error.flatten(),
      });
    }

    const { target_type, target_id } = parsed.data;
    const userId = req.user?.id;

    const stats = await reactionsService.getStats(target_type, target_id, userId);

    return res.json(stats);
  } catch (error) {
    console.error('Get reaction stats error:', error);
    if (error instanceof ReactionsError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /reactions/batch
 * Get reaction stats for multiple targets
 * Optional authentication (to get user's reactions)
 */
router.post('/batch', optionalAuthMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const parsed = getBatchReactionsSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Validation error',
        details: parsed.error.flatten(),
      });
    }

    const { target_type, target_ids } = parsed.data;
    const userId = req.user?.id;

    const stats = await reactionsService.getBatchStats(target_type, target_ids, userId);

    return res.json(stats);
  } catch (error) {
    console.error('Get batch reaction stats error:', error);
    if (error instanceof ReactionsError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /reactions/my
 * Get current user's reactions
 * Requires authentication
 */
router.get('/my', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const parsed = getUserReactionsQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Validation error',
        details: parsed.error.flatten(),
      });
    }

    const { target_type, limit, offset } = parsed.data;
    const userId = req.user!.id;

    const result = await reactionsService.getUserReactions(userId, target_type, limit, offset);

    return res.json(result);
  } catch (error) {
    console.error('Get user reactions error:', error);
    if (error instanceof ReactionsError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export const reactionsRoutes = router;
