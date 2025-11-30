import { pool } from '../../shared/index.js';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { ArticleStatusType, GetArticlesQuery } from './articles.types.js';

const normalizeTagFilter = (value?: string | string[]): string[] => {
  if (!value) return [];
  const arr = Array.isArray(value) ? value : [value];
  return arr.map((t) => t.toLowerCase());
};

export interface ArticleRow extends RowDataPacket {
  id: string;
  author_id: string;
  title: string;
  slug: string;
  header_image: string | null;
  excerpt: string | null;
  content: string;
  status: ArticleStatusType;
  views: number;
  created_at: Date;
  updated_at: Date;
  published_at: Date | null;
}

export interface ArticleWithAuthorRow extends ArticleRow {
  author_username: string;
  author_display_name: string | null;
  author_avatar_url: string | null;
}

export interface CountRow extends RowDataPacket {
  total: number;
}

export const articlesRepository = {
  /**
   * Create a new article
   */
  async create(data: {
    id: string;
    author_id: string;
    title: string;
    slug: string;
    header_image?: string | null;
    excerpt?: string | null;
    content: string;
    status: ArticleStatusType;
  }): Promise<void> {
    const publishedAt = data.status === 'published' ? new Date() : null;
    
    await pool.execute<ResultSetHeader>(
      `INSERT INTO articles (id, author_id, title, slug, header_image, excerpt, content, status, published_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.id,
        data.author_id,
        data.title,
        data.slug,
        data.header_image || null,
        data.excerpt || null,
        data.content,
        data.status,
        publishedAt,
      ]
    );
  },

  /**
   * Find article by ID
   */
  async findById(id: string): Promise<ArticleWithAuthorRow | null> {
    const [rows] = await pool.execute<ArticleWithAuthorRow[]>(
      `SELECT a.*, u.username as author_username, u.display_name as author_display_name, u.avatar_url as author_avatar_url
       FROM articles a
       JOIN users u ON a.author_id = u.id
       WHERE a.id = ?`,
      [id]
    );
    return rows[0] || null;
  },

  /**
   * Find article by slug
   */
  async findBySlug(slug: string): Promise<ArticleWithAuthorRow | null> {
    const [rows] = await pool.execute<ArticleWithAuthorRow[]>(
      `SELECT a.*, u.username as author_username, u.display_name as author_display_name, u.avatar_url as author_avatar_url
       FROM articles a
       JOIN users u ON a.author_id = u.id
       WHERE a.slug = ?`,
      [slug]
    );
    return rows[0] || null;
  },

  /**
   * Check if slug exists (optionally excluding an article)
   */
  async slugExists(slug: string, excludeId?: string): Promise<boolean> {
    const query = excludeId
      ? 'SELECT id FROM articles WHERE slug = ? AND id != ?'
      : 'SELECT id FROM articles WHERE slug = ?';
    const params = excludeId ? [slug, excludeId] : [slug];
    
    const [rows] = await pool.execute<RowDataPacket[]>(query, params);
    return rows.length > 0;
  },

  /**
   * Update article
   */
  async update(
    id: string,
    data: {
      title?: string;
      slug?: string;
      header_image?: string | null;
      excerpt?: string | null;
      content?: string;
      status?: ArticleStatusType;
    }
  ): Promise<void> {
    const updates: string[] = [];
    const values: (string | null | Date)[] = [];

    if (data.title !== undefined) {
      updates.push('title = ?');
      values.push(data.title);
    }
    if (data.slug !== undefined) {
      updates.push('slug = ?');
      values.push(data.slug);
    }
    if (data.header_image !== undefined) {
      updates.push('header_image = ?');
      values.push(data.header_image);
    }
    if (data.excerpt !== undefined) {
      updates.push('excerpt = ?');
      values.push(data.excerpt);
    }
    if (data.content !== undefined) {
      updates.push('content = ?');
      values.push(data.content);
    }
    if (data.status !== undefined) {
      updates.push('status = ?');
      values.push(data.status);
      
      // Set published_at when first published
      if (data.status === 'published') {
        updates.push('published_at = COALESCE(published_at, NOW())');
      }
    }

    if (updates.length === 0) return;

    values.push(id);
    await pool.execute<ResultSetHeader>(
      `UPDATE articles SET ${updates.join(', ')} WHERE id = ?`,
      values
    );
  },

  /**
   * Delete article
   */
  async delete(id: string): Promise<void> {
    await pool.execute<ResultSetHeader>('DELETE FROM articles WHERE id = ?', [id]);
  },

  /**
   * Increment view count
   */
  async incrementViews(id: string): Promise<void> {
    await pool.execute<ResultSetHeader>(
      'UPDATE articles SET views = COALESCE(views, 0) + 1 WHERE id = ?',
      [id]
    );
  },

  /**
   * Get articles list with filters
   */
  async getList(query: GetArticlesQuery, requesterId?: string, isAdmin?: boolean): Promise<ArticleWithAuthorRow[]> {
    const conditions: string[] = [];
    const params: (string | number)[] = [];

    // Status filter
    if (query.status && query.status !== 'all') {
      conditions.push('a.status = ?');
      params.push(query.status);
    } else if (!isAdmin) {
      // Non-admins can only see published articles or their own
      if (requesterId) {
        conditions.push('(a.status = ? OR a.author_id = ?)');
        params.push('published', requesterId);
      } else {
        conditions.push('a.status = ?');
        params.push('published');
      }
    }

    // Author filter
    if (query.author_id) {
      conditions.push('a.author_id = ?');
      params.push(query.author_id);
    }

    // Tag filters (include/exclude)
    const includeTags =
      query.include_tags !== undefined
        ? normalizeTagFilter(query.include_tags)
        : normalizeTagFilter(query.tag ? [query.tag] : undefined);
    const excludeTags = normalizeTagFilter(query.exclude_tags);

    if (includeTags.length > 0) {
      const placeholders = includeTags.map(() => '?').join(', ');
      conditions.push(
        `EXISTS (
           SELECT 1
           FROM tags t
           WHERE t.target_type = 'article'
             AND t.target_id = a.id
             AND t.tag IN (${placeholders})
           GROUP BY t.target_id
           HAVING COUNT(DISTINCT t.tag) = ?
         )`
      );
      params.push(...includeTags, includeTags.length);
    }

    if (excludeTags.length > 0) {
      const placeholders = excludeTags.map(() => '?').join(', ');
      conditions.push(
        `NOT EXISTS (
           SELECT 1
           FROM tags t
           WHERE t.target_type = 'article'
             AND t.target_id = a.id
             AND t.tag IN (${placeholders})
         )`
      );
      params.push(...excludeTags);
    }

    // Search filter
    if (query.search) {
      conditions.push('(a.title LIKE ? OR a.excerpt LIKE ?)');
      const searchPattern = `%${query.search}%`;
      params.push(searchPattern, searchPattern);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    
    // Validate sort field to prevent SQL injection
    const allowedSortFields = ['created_at', 'updated_at', 'title', 'views'];
    const sortField = allowedSortFields.includes(query.sort) ? query.sort : 'created_at';
    const sortOrder = query.order === 'asc' ? 'ASC' : 'DESC';

    params.push(query.limit, query.offset);

    const [rows] = await pool.execute<ArticleWithAuthorRow[]>(
      `SELECT a.id, a.author_id, a.title, a.slug, a.header_image, a.excerpt, a.status, a.views, a.created_at, a.published_at,
              u.username as author_username, u.display_name as author_display_name, u.avatar_url as author_avatar_url
       FROM articles a
       JOIN users u ON a.author_id = u.id
       ${whereClause}
       ORDER BY a.${sortField} ${sortOrder}
       LIMIT ? OFFSET ?`,
      params
    );

    return rows;
  },

  /**
   * Get total count with filters
   */
  async getCount(query: GetArticlesQuery, requesterId?: string, isAdmin?: boolean): Promise<number> {
    const conditions: string[] = [];
    const params: (string | number)[] = [];

    if (query.status && query.status !== 'all') {
      conditions.push('a.status = ?');
      params.push(query.status);
    } else if (!isAdmin) {
      if (requesterId) {
        conditions.push('(a.status = ? OR a.author_id = ?)');
        params.push('published', requesterId);
      } else {
        conditions.push('a.status = ?');
        params.push('published');
      }
    }

    if (query.author_id) {
      conditions.push('a.author_id = ?');
      params.push(query.author_id);
    }

    // Tag filters (include/exclude)
    const includeTagsSource = query.include_tags ?? (query.tag ? [query.tag] : undefined);
    const includeTags = includeTagsSource?.map((t) => t.toLowerCase()) ?? [];
    const excludeTags = (query.exclude_tags ?? []).map((t) => t.toLowerCase());

    if (includeTags.length > 0) {
      const placeholders = includeTags.map(() => '?').join(', ');
      conditions.push(
        `EXISTS (
           SELECT 1
           FROM tags t
           WHERE t.target_type = 'article'
             AND t.target_id = a.id
             AND t.tag IN (${placeholders})
           GROUP BY t.target_id
           HAVING COUNT(DISTINCT t.tag) = ?
         )`
      );
      params.push(...includeTags, includeTags.length);
    }

    if (excludeTags.length > 0) {
      const placeholders = excludeTags.map(() => '?').join(', ');
      conditions.push(
        `NOT EXISTS (
           SELECT 1
           FROM tags t
           WHERE t.target_type = 'article'
             AND t.target_id = a.id
             AND t.tag IN (${placeholders})
         )`
      );
      params.push(...excludeTags);
    }

    if (query.search) {
      conditions.push('(a.title LIKE ? OR a.excerpt LIKE ?)');
      const searchPattern = `%${query.search}%`;
      params.push(searchPattern, searchPattern);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const [rows] = await pool.execute<CountRow[]>(
      `SELECT COUNT(*) as total FROM articles a ${whereClause}`,
      params
    );

    return rows[0].total;
  },

  /**
   * Get user's articles count by status
   */
  async getUserArticlesStats(userId: string): Promise<{ total: number; published: number; drafts: number; private: number }> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT 
         COUNT(*) as total,
         SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END) as published,
         SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as drafts,
         SUM(CASE WHEN status = 'private' THEN 1 ELSE 0 END) as private_count
       FROM articles WHERE author_id = ?`,
      [userId]
    );
    
    return {
      total: Number(rows[0].total) || 0,
      published: Number(rows[0].published) || 0,
      drafts: Number(rows[0].drafts) || 0,
      private: Number(rows[0].private_count) || 0,
    };
  },
};
