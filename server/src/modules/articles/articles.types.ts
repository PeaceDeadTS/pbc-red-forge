import { z } from 'zod';

// Article status enum
export const ArticleStatus = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  PRIVATE: 'private',
} as const;

export type ArticleStatusType = (typeof ArticleStatus)[keyof typeof ArticleStatus];

// Validation schemas
export const createArticleSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().min(3).max(200).regex(/^[a-z0-9-]+$/).optional(),
  header_image: z.string().url().max(500).optional().nullable(),
  excerpt: z.string().max(500).optional().nullable(),
  content: z.string().min(1), // JSON content from TipTap editor
  tags: z.array(z.string().max(50)).max(10).optional(),
  status: z.enum(['draft', 'published', 'private']).default('draft'),
});

export const updateArticleSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/).optional(),
  header_image: z.string().url().max(500).optional().nullable(),
  excerpt: z.string().max(500).optional().nullable(),
  content: z.string().min(1).optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
  status: z.enum(['draft', 'published', 'private']).optional(),
});

export const updateArticleStatusSchema = z.object({
  status: z.enum(['draft', 'published', 'private']),
});

export const getArticlesQuerySchema = z.object({
  sort: z.enum(['created_at', 'updated_at', 'title', 'views']).default('created_at'),
  order: z.enum(['asc', 'desc']).default('desc'),
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
  status: z.enum(['draft', 'published', 'private', 'all']).optional(),
  author_id: z.string().uuid().optional(),
  tag: z.string().max(50).optional(),
  search: z.string().max(100).optional(),
});

// Types inferred from schemas
export type CreateArticleInput = z.infer<typeof createArticleSchema>;
export type UpdateArticleInput = z.infer<typeof updateArticleSchema>;
export type UpdateArticleStatusInput = z.infer<typeof updateArticleStatusSchema>;
export type GetArticlesQuery = z.infer<typeof getArticlesQuerySchema>;

// Response types
export interface ArticleAuthor {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}

export interface ArticleResponse {
  id: string;
  title: string;
  slug: string;
  header_image: string | null;
  excerpt: string | null;
  content: string;
  status: ArticleStatusType;
  views: number;
  author: ArticleAuthor;
  tags: string[];
  created_at: Date;
  updated_at: Date;
  published_at: Date | null;
}

export interface ArticleListItem {
  id: string;
  title: string;
  slug: string;
  header_image: string | null;
  excerpt: string | null;
  status: ArticleStatusType;
  views: number;
  author: ArticleAuthor;
  tags: string[];
  created_at: Date;
  published_at: Date | null;
}

export interface ArticlesListResponse {
  articles: ArticleListItem[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
  };
}

// Error class for articles module
export class ArticlesError extends Error {
  constructor(
    message: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'ArticlesError';
  }
}
