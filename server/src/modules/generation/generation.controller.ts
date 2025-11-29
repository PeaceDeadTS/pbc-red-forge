import { Router, Response } from 'express';
import { z } from 'zod';
import { authMiddleware, AuthRequest } from '../../shared/index.js';
import { generationService, GenerationError } from './generation.service.js';
import { createGenerationJobSchema } from './generation.types.js';

const router = Router();

/**
 * GET /api/generation/status
 * Get generation service status
 */
router.get('/status', async (_req, res: Response): Promise<void> => {
  try {
    const status = await generationService.getStatus();
    res.json(status);
  } catch (error) {
    console.error('Error getting generation status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/generation/jobs
 * Create a new generation job
 */
router.post('/jobs', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const input = createGenerationJobSchema.parse(req.body);
    const job = await generationService.createJob(req.user.id, input);
    res.status(201).json({ job });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }
    if (error instanceof GenerationError) {
      res.status(error.statusCode).json({ error: error.message });
      return;
    }
    console.error('Error creating generation job:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/generation/jobs
 * Get user's generation jobs
 */
router.get('/jobs', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { limit, offset } = req.query as Record<string, string>;
    const result = await generationService.getUserJobs(req.user.id, {
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });
    res.json(result);
  } catch (error) {
    if (error instanceof GenerationError) {
      res.status(error.statusCode).json({ error: error.message });
      return;
    }
    console.error('Error getting generation jobs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/generation/jobs/:id
 * Get specific generation job
 */
router.get('/jobs/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { id } = req.params;
    const job = await generationService.getJob(id, req.user.id);
    res.json({ job });
  } catch (error) {
    if (error instanceof GenerationError) {
      res.status(error.statusCode).json({ error: error.message });
      return;
    }
    console.error('Error getting generation job:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * DELETE /api/generation/jobs/:id
 * Cancel a pending generation job
 */
router.delete('/jobs/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { id } = req.params;
    await generationService.cancelJob(id, req.user.id);
    res.json({ message: 'Job cancelled' });
  } catch (error) {
    if (error instanceof GenerationError) {
      res.status(error.statusCode).json({ error: error.message });
      return;
    }
    console.error('Error cancelling generation job:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
