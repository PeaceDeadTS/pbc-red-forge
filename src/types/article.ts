export type ArticleStatus = 'draft' | 'published' | 'private';

export interface ArticleAuthor {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}

export interface Article {
  id: string;
  title: string;
  slug: string;
  header_image: string | null;
  excerpt: string | null;
  content: string;
  status: ArticleStatus;
  views: number;
  author: ArticleAuthor;
  tags: string[];
  created_at: string;
  updated_at: string;
  published_at: string | null;
}

export interface ArticleListItem {
  id: string;
  title: string;
  slug: string;
  header_image: string | null;
  excerpt: string | null;
  status: ArticleStatus;
  views: number;
  author: ArticleAuthor;
  tags: string[];
  created_at: string;
  published_at: string | null;
}

export interface ArticlesListResponse {
  articles: ArticleListItem[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
  };
}

export interface CreateArticleInput {
  title: string;
  slug?: string;
  header_image?: string | null;
  excerpt?: string | null;
  content: string;
  tags?: string[];
  status?: ArticleStatus;
}

export interface UpdateArticleInput {
  title?: string;
  slug?: string;
  header_image?: string | null;
  excerpt?: string | null;
  content?: string;
  tags?: string[];
  status?: ArticleStatus;
}

export interface GetArticlesParams {
  sort?: 'created_at' | 'updated_at' | 'title' | 'views';
  order?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
  status?: ArticleStatus | 'all';
  author_id?: string;
  tag?: string;
  search?: string;
}

export interface ArticleStats {
  total: number;
  published: number;
  drafts: number;
  private: number;
}

export interface TagWithCount {
  tag: string;
  count: number;
}
