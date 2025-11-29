import { Router, Response } from 'express';
import { z } from 'zod';
import { authMiddleware, optionalAuthMiddleware, AuthRequest } from '../../shared/index.js';
import { usersService, UsersError } from './users.service.js';
import {
  updateProfileSchema,
  changePasswordSchema,
  updateUserGroupsSchema,
} from './users.types.js';

const router = Router();

/**
 * GET /api/users
 * Get list of all users (public endpoint)
 */
router.get('/', optionalAuthMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { sort, order, limit, offset } = req.query as Record<string, string>;

    const result = await usersService.getUsers({
      sort,
      order,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });

    res.json(result);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/users/groups/list
 * Get all available groups
 */
router.get('/groups/list', async (_req, res: Response): Promise<void> => {
  try {
    const groups = await usersService.getGroups();
    res.json({ groups });
  } catch (error) {
    console.error('Error fetching groups:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/users/:id
 * Get user profile by ID
 */
router.get('/:id', optionalAuthMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await usersService.getProfile(id, req.user?.id);
    res.json(result);
  } catch (error) {
    if (error instanceof UsersError) {
      res.status(error.statusCode).json({ error: error.message });
      return;
    }
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PATCH /api/users/me
 * Update own profile
 */
router.patch('/me', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const data = updateProfileSchema.parse(req.body);
    const user = await usersService.updateProfile(req.user.id, data);
    res.json({ user });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }
    if (error instanceof UsersError) {
      res.status(error.statusCode).json({ error: error.message });
      return;
    }
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/users/me/change-password
 * Change own password
 */
router.post('/me/change-password', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const data = changePasswordSchema.parse(req.body);
    await usersService.changePassword(req.user.id, req.user.sessionId, data);
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }
    if (error instanceof UsersError) {
      res.status(error.statusCode).json({ error: error.message });
      return;
    }
    console.error('Error changing password:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PATCH /api/users/:id/groups
 * Update user groups (admin only)
 */
router.patch('/:id/groups', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    // Check if current user is admin
    const isAdmin = await usersService.isAdmin(req.user.id);
    if (!isAdmin) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    const { id } = req.params;
    const data = updateUserGroupsSchema.parse(req.body);
    const groups = await usersService.updateUserGroups(id, data.groups, req.user.id);
    res.json({ groups });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }
    if (error instanceof UsersError) {
      res.status(error.statusCode).json({ error: error.message });
      return;
    }
    console.error('Error updating user groups:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
