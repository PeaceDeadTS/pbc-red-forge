import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { FileText, Plus, Search, Filter, Loader2, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArticleCard } from '@/components/ArticleCard';
import { articlesApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import type { ArticleListItem, TagWithCount } from '@/types/article';

const Articles = () => {
  const { t } = useTranslation();
  const { user, isAuthenticated } = useAuth();
  const [searchParams] = useSearchParams();

  const [articles, setArticles] = useState<ArticleListItem[]>([]);
  const [tags, setTags] = useState<TagWithCount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [canCreate, setCanCreate] = useState(false);
  const [total, setTotal] = useState(0);

  // Filters
  const [search, setSearch] = useState('');
  const [tagFilters, setTagFilters] = useState<Record<string, 'include' | 'exclude'>>({});
  const [sortBy, setSortBy] = useState<string>('created_at');
  const [sortOrder, setSortOrder] = useState<string>('desc');

  // Pagination
  const [page, setPage] = useState(1);
  const limit = 20;

  const includeTags = Object.entries(tagFilters)
    .filter(([, mode]) => mode === 'include')
    .map(([tag]) => tag);

  const excludeTags = Object.entries(tagFilters)
    .filter(([, mode]) => mode === 'exclude')
    .map(([tag]) => tag);

  // Инициализация include-фильтра из ?tag= при переходе со страницы статьи
  useEffect(() => {
    const tagFromQuery = searchParams.get('tag');
    if (!tagFromQuery) return;

    setTagFilters((prev) => {
      if (Object.keys(prev).length === 1 && prev[tagFromQuery] === 'include') {
        return prev;
      }
      return { [tagFromQuery]: 'include' };
    });
    setPage(1);
  }, [searchParams]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [articlesRes, tagsRes] = await Promise.all([
          articlesApi.getArticles({
            sort: sortBy,
            order: sortOrder,
            limit,
            offset: (page - 1) * limit,
            include_tags: includeTags.length > 0 ? includeTags : undefined,
            exclude_tags: excludeTags.length > 0 ? excludeTags : undefined,
            search: search || undefined,
          }),
          articlesApi.getTags(),
        ]);

        setArticles(articlesRes.data.articles);
        setTotal(articlesRes.data.pagination.total);
        setTags(tagsRes.data.tags);
      } catch (error) {
        console.error('Failed to fetch articles:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [page, sortBy, sortOrder, search, includeTags.join(','), excludeTags.join(',')]);

  // Check if user can create articles
  useEffect(() => {
    const checkCanCreate = async () => {
      if (!isAuthenticated) {
        setCanCreate(false);
        return;
      }
      try {
        const res = await articlesApi.canCreate();
        setCanCreate(res.data.canCreate);
      } catch {
        setCanCreate(false);
      }
    };
    checkCanCreate();
  }, [isAuthenticated, user]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  const toggleTagFilter = (tag: string) => {
    setTagFilters((prev) => {
      const current = prev[tag];
      const next: Record<string, 'include' | 'exclude'> = { ...prev };

      if (!current) {
        next[tag] = 'include';
      } else if (current === 'include') {
        next[tag] = 'exclude';
      } else {
        delete next[tag];
      }

      return next;
    });
    setPage(1);
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="container mx-auto px-4 max-w-6xl 2xl:max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-display font-bold flex items-center gap-3">
                <FileText className="h-10 w-10 text-primary" />
                {t('articles.title')}
              </h1>
              <p className="text-muted-foreground mt-2">
                {t('articles.subtitle')}
              </p>
            </div>

            {canCreate && (
              <Link to="/articles/new">
                <Button className="bg-gradient-primary text-primary-foreground hover:shadow-glow">
                  <Plus className="h-4 w-4 mr-2" />
                  {t('articles.create')}
                </Button>
              </Link>
            )}
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-8 space-y-4"
        >
          {/* Search and Sort */}
          <div className="flex flex-col sm:flex-row gap-4">
            <form onSubmit={handleSearch} className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t('articles.searchPlaceholder')}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </form>

            <div className="flex gap-2">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[160px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created_at">{t('articles.sort.date')}</SelectItem>
                  <SelectItem value="title">{t('articles.sort.title')}</SelectItem>
                  <SelectItem value="views">{t('articles.sort.views')}</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortOrder} onValueChange={setSortOrder}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">{t('articles.sort.desc')}</SelectItem>
                  <SelectItem value="asc">{t('articles.sort.asc')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <Badge
                variant={Object.keys(tagFilters).length === 0 ? 'default' : 'outline'}
                className="cursor-pointer hover:bg-primary/80"
                onClick={() => {
                  setTagFilters({});
                  setPage(1);
                }}
              >
                <Tag className="h-3 w-3 mr-1" />
                {t('articles.allTags')}
              </Badge>
              {tags.slice(0, 15).map((tag) => (
                <Badge
                  key={tag.tag}
                  variant={tagFilters[tag.tag] === 'include' ? 'default' : 'outline'}
                  className={`cursor-pointer hover:bg-primary/80 ${
                    tagFilters[tag.tag] === 'exclude' ? 'border-destructive text-destructive' : ''
                  }`}
                  onClick={() => {
                    toggleTagFilter(tag.tag);
                  }}
                >
                  {tag.tag} ({tag.count})
                </Badge>
              ))}
            </div>
          )}
        </motion.div>

        {/* Articles Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        ) : articles.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <FileText className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-xl font-semibold text-muted-foreground">
              {t('articles.noArticles')}
            </h3>
            <p className="text-muted-foreground mt-2">
              {t('articles.noArticlesDesc')}
            </p>
          </motion.div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {articles.map((article, index) => (
                <ArticleCard key={article.id} article={article} index={index} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-8">
                <Button
                  variant="outline"
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                >
                  {t('common.previous')}
                </Button>
                <div className="flex items-center gap-2 px-4">
                  <span className="text-muted-foreground">
                    {t('common.page')} {page} / {totalPages}
                  </span>
                </div>
                <Button
                  variant="outline"
                  disabled={page === totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  {t('common.next')}
                </Button>
              </div>
            )}

            {/* Total count */}
            <p className="text-center text-muted-foreground mt-4">
              {t('articles.totalArticles', { count: total })}
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default Articles;
