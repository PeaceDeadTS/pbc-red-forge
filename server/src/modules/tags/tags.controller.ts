import { Router, Request, Response } from 'express';
import { tagsService } from './tags.service.js';
import { getAllTagsQuerySchema, getTargetTagsQuerySchema, TagsError } from './tags.types.js';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const parsed = getAllTagsQuerySchema.safeParse(req.query);

    if (!parsed.success) {
      return res.status(400).json({
        error: 'Validation error',
        details: parsed.error.flatten(),
      });
    }

    const { target_type, search, limit, offset } = parsed.data;
    const targetType = target_type ?? 'article';

    if (targetType !== 'article') {
      return res.status(400).json({ error: 'Unsupported target_type' });
    }

    const allTags = await tagsService.getAllTagsForArticles();

    const normalizedSearch = search?.toLowerCase().trim();
    const filtered = normalizedSearch
      ? allTags.filter((t) => t.tag.toLowerCase().includes(normalizedSearch))
      : allTags;

    const start = offset;
    const end = offset + limit;
    const pageTags = filtered.slice(start, end);

    return res.json({
      tags: pageTags,
      total: filtered.length,
    });
  } catch (error) {
    console.error('Get tags error:', error);
    if (error instanceof TagsError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/target', async (req: Request, res: Response) => {
  try {
    const parsed = getTargetTagsQuerySchema.safeParse(req.query);

    if (!parsed.success) {
      return res.status(400).json({
        error: 'Validation error',
        details: parsed.error.flatten(),
      });
    }

    const { target_type, target_id } = parsed.data;

    const tags = await tagsService.getTags(target_type, target_id);

    return res.json({ tags });
  } catch (error) {
    console.error('Get target tags error:', error);
    if (error instanceof TagsError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export const tagsRoutes = router;
