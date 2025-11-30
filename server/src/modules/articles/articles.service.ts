import { v4 as uuidv4 } from 'uuid';
import { articlesRepository } from './articles.repository.js';
import {
  ArticlesError,
  CreateArticleInput,
  UpdateArticleInput,
  GetArticlesQuery,
  ArticleResponse,
  ArticleListItem,
  ArticlesListResponse,
  ArticleStatusType,
} from './articles.types.js';
import { usersRepository } from '../users/users.repository.js';

/**
 * Generate URL-friendly slug from title
 */
const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .trim()
    .slice(0, 100);
};

/**
 * Ensure slug is unique by appending number if needed
 */
const ensureUniqueSlug = async (baseSlug: string, excludeId?: string): Promise<string> => {
  let slug = baseSlug;
  let counter = 1;
  
  while (await articlesRepository.slugExists(slug, excludeId)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
  
  return slug;
};

/**
 * Check if user has permission to create articles
 */
const canCreateArticles = async (userId: string): Promise<boolean> => {
  const rights = await usersRepository.getUserRights(userId);
  // Wildcard (*) means all rights, or specific right to create content
  return rights.includes('*') || rights.includes('create_content');
};

/**
 * Check if user has admin rights
 */
const isAdmin = async (userId: string): Promise<boolean> => {
  const rights = await usersRepository.getUserRights(userId);
  return rights.includes('*');
};

export const articlesService = {
  /**
   * Create a new article
   */
  async create(userId: string, input: CreateArticleInput): Promise<ArticleResponse> {
    // Check permission
    if (!(await canCreateArticles(userId))) {
      throw new ArticlesError('You do not have permission to create articles', 403);
    }

    const id = uuidv4();
    
    // Generate or validate slug
    let slug = input.slug || generateSlug(input.title);
    slug = await ensureUniqueSlug(slug);

    await articlesRepository.create({
      id,
      author_id: userId,
      title: input.title,
      slug,
      header_image: input.header_image,
      excerpt: input.excerpt,
      content: input.content,
      status: input.status || 'draft',
    });

    // Add tags if provided
    if (input.tags && input.tags.length > 0) {
      await articlesRepository.addTags(id, input.tags);
    }

    // Fetch and return the created article
    const article = await this.getById(id, userId);
    if (!article) {
      throw new ArticlesError('Failed to create article', 500);
    }

    return article;
  },

  /**
   * Update an article
   */
  async update(articleId: string, userId: string, input: UpdateArticleInput): Promise<ArticleResponse> {
    const article = await articlesRepository.findById(articleId);
    
    if (!article) {
      throw new ArticlesError('Article not found', 404);
    }

    // Check permission: author or admin
    const userIsAdmin = await isAdmin(userId);
    if (article.author_id !== userId && !userIsAdmin) {
      throw new ArticlesError('You do not have permission to edit this article', 403);
    }

    // Validate slug uniqueness if changing
    if (input.slug && input.slug !== article.slug) {
      const slugExists = await articlesRepository.slugExists(input.slug, articleId);
      if (slugExists) {
        throw new ArticlesError('This slug is already in use', 400);
      }
    }

    await articlesRepository.update(articleId, {
      title: input.title,
      slug: input.slug,
      header_image: input.header_image,
      excerpt: input.excerpt,
      content: input.content,
      status: input.status as ArticleStatusType | undefined,
    });

    // Update tags if provided
    if (input.tags !== undefined) {
      await articlesRepository.removeTags(articleId);
      if (input.tags.length > 0) {
        await articlesRepository.addTags(articleId, input.tags);
      }
    }

    const updated = await this.getById(articleId, userId);
    if (!updated) {
      throw new ArticlesError('Failed to update article', 500);
    }

    return updated;
  },

  /**
   * Update article status (admin only or author)
   */
  async updateStatus(articleId: string, userId: string, status: ArticleStatusType): Promise<ArticleResponse> {
    const article = await articlesRepository.findById(articleId);
    
    if (!article) {
      throw new ArticlesError('Article not found', 404);
    }

    const userIsAdmin = await isAdmin(userId);
    if (article.author_id !== userId && !userIsAdmin) {
      throw new ArticlesError('You do not have permission to change this article status', 403);
    }

    await articlesRepository.update(articleId, { status });

    const updated = await this.getById(articleId, userId);
    if (!updated) {
      throw new ArticlesError('Failed to update article status', 500);
    }

    return updated;
  },

  /**
   * Delete an article
   */
  async delete(articleId: string, userId: string): Promise<void> {
    const article = await articlesRepository.findById(articleId);
    
    if (!article) {
      throw new ArticlesError('Article not found', 404);
    }

    const userIsAdmin = await isAdmin(userId);
    if (article.author_id !== userId && !userIsAdmin) {
      throw new ArticlesError('You do not have permission to delete this article', 403);
    }

    await articlesRepository.delete(articleId);
  },

  /**
   * Get article by ID
   */
  async getById(articleId: string, requesterId?: string): Promise<ArticleResponse | null> {
    const article = await articlesRepository.findById(articleId);
    
    if (!article) {
      return null;
    }

    // Check access
    const userIsAdmin = requesterId ? await isAdmin(requesterId) : false;
    if (article.status !== 'published') {
      if (!requesterId) {
        return null; // Not authenticated
      }
      if (article.author_id !== requesterId && !userIsAdmin) {
        return null; // Not author and not admin
      }
    }

    const tags = await articlesRepository.getTags(articleId);

    const baseViews = article.views ?? 0;

    return {
      id: article.id,
      title: article.title,
      slug: article.slug,
      header_image: article.header_image,
      excerpt: article.excerpt,
      content: article.content,
      status: article.status,
      views: article.views,
      author: {
        id: article.author_id,
        username: article.author_username,
        display_name: article.author_display_name,
        avatar_url: article.author_avatar_url,
      },
      tags,
      created_at: article.created_at,
      updated_at: article.updated_at,
      published_at: article.published_at,
    };
  },

  /**
   * Get article by slug
   */
  async getBySlug(slug: string, requesterId?: string, incrementViews = true): Promise<ArticleResponse | null> {
    const article = await articlesRepository.findBySlug(slug);
    
    if (!article) {
      return null;
    }

    // Check access
    const userIsAdmin = requesterId ? await isAdmin(requesterId) : false;
    if (article.status !== 'published') {
      if (!requesterId) {
        return null;
      }
      if (article.author_id !== requesterId && !userIsAdmin) {
        return null;
      }
    }

    const shouldIncrement = incrementViews && article.status === 'published' && article.author_id !== requesterId;

    // Increment views for published articles when viewed by non-author
    if (shouldIncrement) {
      await articlesRepository.incrementViews(article.id);
    }

    const tags = await articlesRepository.getTags(article.id);

    const baseViews = article.views ?? 0;

    return {
      id: article.id,
      title: article.title,
      slug: article.slug,
      header_image: article.header_image,
      excerpt: article.excerpt,
      content: article.content,
      status: article.status,
      views: baseViews + (shouldIncrement ? 1 : 0),
      author: {
        id: article.author_id,
        username: article.author_username,
        display_name: article.author_display_name,
        avatar_url: article.author_avatar_url,
      },
      tags,
      created_at: article.created_at,
      updated_at: article.updated_at,
      published_at: article.published_at,
    };
  },

  /**
   * Get articles list
   */
  async getList(query: GetArticlesQuery, requesterId?: string): Promise<ArticlesListResponse> {
    const userIsAdmin = requesterId ? await isAdmin(requesterId) : false;
    
    const [articles, total] = await Promise.all([
      articlesRepository.getList(query, requesterId, userIsAdmin),
      articlesRepository.getCount(query, requesterId, userIsAdmin),
    ]);

    // Get tags for all articles
    const articleIds = articles.map((a) => a.id);
    const tagsMap = await articlesRepository.getTagsForArticles(articleIds);

    const items: ArticleListItem[] = articles.map((article) => ({
      id: article.id,
      title: article.title,
      slug: article.slug,
      header_image: article.header_image,
      excerpt: article.excerpt,
      status: article.status,
      views: article.views,
      author: {
        id: article.author_id,
        username: article.author_username,
        display_name: article.author_display_name,
        avatar_url: article.author_avatar_url,
      },
      tags: tagsMap.get(article.id) || [],
      created_at: article.created_at,
      published_at: article.published_at,
    }));

    return {
      articles: items,
      pagination: {
        total,
        limit: query.limit,
        offset: query.offset,
      },
    };
  },

  /**
   * Get user's articles stats
   */
  async getUserStats(userId: string): Promise<{ total: number; published: number; drafts: number; private: number }> {
    return articlesRepository.getUserArticlesStats(userId);
  },

  /**
   * Get all tags
   */
  async getAllTags(): Promise<{ tag: string; count: number }[]> {
    return articlesRepository.getAllTags();
  },

  /**
   * Check if user can create articles
   */
  async canUserCreateArticles(userId: string): Promise<boolean> {
    return canCreateArticles(userId);
  },
};
