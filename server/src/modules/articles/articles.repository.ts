import { pool } from '../../shared/index.js';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { ArticleStatusType, GetArticlesQuery } from './articles.types.js';

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

export interface ArticleTagRow extends RowDataPacket {
  article_id: string;
  tag: string;
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
   * Add tags to article
   */
  async addTags(articleId: string, tags: string[]): Promise<void> {
    if (tags.length === 0) return;
    
    const values = tags.map((tag) => [articleId, tag.toLowerCase().trim()]);
    const placeholders = values.map(() => '(?, ?)').join(', ');
    const flatValues = values.flat();
    
    await pool.execute(
      `INSERT IGNORE INTO article_tags (article_id, tag) VALUES ${placeholders}`,
      flatValues
    );
  },

  /**
   * Remove all tags from article
   */
  async removeTags(articleId: string): Promise<void> {
    await pool.execute('DELETE FROM article_tags WHERE article_id = ?', [articleId]);
  },

  /**
   * Get tags for article
   */
  async getTags(articleId: string): Promise<string[]> {
    const [rows] = await pool.execute<ArticleTagRow[]>(
      'SELECT tag FROM article_tags WHERE article_id = ?',
      [articleId]
    );
    return rows.map((r: ArticleTagRow) => r.tag);
  },

  /**
   * Get tags for multiple articles
   */
  async getTagsForArticles(articleIds: string[]): Promise<Map<string, string[]>> {
    if (articleIds.length === 0) return new Map();
    
    const placeholders = articleIds.map(() => '?').join(',');
    const [rows] = await pool.execute<ArticleTagRow[]>(
      `SELECT article_id, tag FROM article_tags WHERE article_id IN (${placeholders})`,
      articleIds
    );
    
    const tagsMap = new Map<string, string[]>();
    for (const row of rows) {
      const existing = tagsMap.get(row.article_id) || [];
      existing.push(row.tag);
      tagsMap.set(row.article_id, existing);
    }
    return tagsMap;
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

    // Tag filter
    if (query.tag) {
      conditions.push('EXISTS (SELECT 1 FROM article_tags at WHERE at.article_id = a.id AND at.tag = ?)');
      params.push(query.tag.toLowerCase());
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

    if (query.tag) {
      conditions.push('EXISTS (SELECT 1 FROM article_tags at WHERE at.article_id = a.id AND at.tag = ?)');
      params.push(query.tag.toLowerCase());
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

  /**
   * Get all unique tags with counts
   */
  async getAllTags(): Promise<{ tag: string; count: number }[]> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT at.tag, COUNT(*) as count
       FROM article_tags at
       JOIN articles a ON at.article_id = a.id
       WHERE a.status = 'published'
       GROUP BY at.tag
       ORDER BY count DESC, at.tag ASC
       LIMIT 100`
    );
    
    return rows.map((r: RowDataPacket) => ({ tag: r.tag as string, count: Number(r.count) }));
  },
};
