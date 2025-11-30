import { Router, Request, Response } from 'express';
import { authMiddleware, optionalAuthMiddleware, AuthRequest } from '../../shared/index.js';
import { articlesService } from './articles.service.js';
import {
  createArticleSchema,
  updateArticleSchema,
  updateArticleStatusSchema,
  getArticlesQuerySchema,
  ArticlesError,
} from './articles.types.js';

const router = Router();

/**
 * GET /articles
 * Get list of articles with filtering and pagination
 */
router.get('/', optionalAuthMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const queryResult = getArticlesQuerySchema.safeParse(req.query);
    if (!queryResult.success) {
      return res.status(400).json({ error: 'Invalid query parameters', details: queryResult.error.errors });
    }

    const userId = req.user?.id;
    const result = await articlesService.getList(queryResult.data, userId);

    return res.json(result);
  } catch (error) {
    console.error('Get articles error:', error);
    if (error instanceof ArticlesError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /articles/tags
 * Get all available tags with counts
 */
router.get('/tags', async (_req: Request, res: Response) => {
  try {
    const tags = await articlesService.getAllTags();
    return res.json({ tags });
  } catch (error) {
    console.error('Get tags error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /articles/my
 * Get current user's articles
 */
router.get('/my', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const queryResult = getArticlesQuerySchema.safeParse({ ...req.query, author_id: userId, status: 'all' });
    if (!queryResult.success) {
      return res.status(400).json({ error: 'Invalid query parameters', details: queryResult.error.errors });
    }

    const result = await articlesService.getList(queryResult.data, userId);
    return res.json(result);
  } catch (error) {
    console.error('Get my articles error:', error);
    if (error instanceof ArticlesError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /articles/my/stats
 * Get current user's articles statistics
 */
router.get('/my/stats', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const stats = await articlesService.getUserStats(userId);
    return res.json(stats);
  } catch (error) {
    console.error('Get my stats error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /articles/can-create
 * Check if current user can create articles
 */
router.get('/can-create', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const canCreate = await articlesService.canUserCreateArticles(userId);
    return res.json({ canCreate });
  } catch (error) {
    console.error('Check can create error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /articles/user/:userId
 * Get articles by specific user
 */
router.get('/user/:userId', optionalAuthMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const requesterId = req.user?.id;
    
    // If viewing own articles, show all statuses; otherwise only published
    const status = requesterId === userId ? 'all' : 'published';
    
    const queryResult = getArticlesQuerySchema.safeParse({ ...req.query, author_id: userId, status });
    if (!queryResult.success) {
      return res.status(400).json({ error: 'Invalid query parameters', details: queryResult.error.errors });
    }

    const result = await articlesService.getList(queryResult.data, requesterId);
    return res.json(result);
  } catch (error) {
    console.error('Get user articles error:', error);
    if (error instanceof ArticlesError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /articles
 * Create a new article
 */
router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const parseResult = createArticleSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: 'Validation error', details: parseResult.error.errors });
    }

    const userId = req.user!.id;
    const article = await articlesService.create(userId, parseResult.data);

    return res.status(201).json(article);
  } catch (error) {
    console.error('Create article error:', error);
    if (error instanceof ArticlesError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /articles/:idOrSlug
 * Get article by ID or slug
 */
router.get('/:idOrSlug', optionalAuthMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { idOrSlug } = req.params;
    const userId = req.user?.id;

    // Try to find by ID first (UUID format), then by slug
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);
    
    let article;
    if (isUuid) {
      article = await articlesService.getById(idOrSlug, userId);
    } else {
      article = await articlesService.getBySlug(idOrSlug, userId);
    }

    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    return res.json(article);
  } catch (error) {
    console.error('Get article error:', error);
    if (error instanceof ArticlesError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PATCH /articles/:id
 * Update an article
 */
router.patch('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const parseResult = updateArticleSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: 'Validation error', details: parseResult.error.errors });
    }

    const userId = req.user!.id;
    const article = await articlesService.update(id, userId, parseResult.data);

    return res.json(article);
  } catch (error) {
    console.error('Update article error:', error);
    if (error instanceof ArticlesError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PATCH /articles/:id/status
 * Update article status
 */
router.patch('/:id/status', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const parseResult = updateArticleStatusSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: 'Validation error', details: parseResult.error.errors });
    }

    const userId = req.user!.id;
    const article = await articlesService.updateStatus(id, userId, parseResult.data.status);

    return res.json(article);
  } catch (error) {
    console.error('Update article status error:', error);
    if (error instanceof ArticlesError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * DELETE /articles/:id
 * Delete an article
 */
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    await articlesService.delete(id, userId);

    return res.json({ success: true });
  } catch (error) {
    console.error('Delete article error:', error);
    if (error instanceof ArticlesError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export const articlesRoutes = router;
