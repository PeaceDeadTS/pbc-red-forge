import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { FileText, Plus, Eye, Edit, Trash2, Loader2, Lock, FileEdit, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { articlesApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import type { ArticleListItem, ArticleStats } from '@/types/article';

interface UserArticlesProps {
  userId: string;
  isOwner: boolean;
  canCreate?: boolean;
}

export const UserArticles = ({ userId, isOwner, canCreate = false }: UserArticlesProps) => {
  const { t } = useTranslation();
  const { toast } = useToast();

  const [articles, setArticles] = useState<ArticleListItem[]>([]);
  const [stats, setStats] = useState<ArticleStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteArticleId, setDeleteArticleId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchArticles = async () => {
      setIsLoading(true);
      try {
        const [articlesRes, statsRes] = await Promise.all([
          isOwner
            ? articlesApi.getMyArticles({ limit: 10 })
            : articlesApi.getUserArticles(userId, { limit: 10 }),
          isOwner ? articlesApi.getMyStats() : Promise.resolve(null),
        ]);

        setArticles(articlesRes.data.articles);
        if (statsRes) {
          setStats(statsRes.data);
        }
      } catch (error) {
        console.error('Failed to fetch articles:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchArticles();
  }, [userId, isOwner]);

  const handleDelete = async () => {
    if (!deleteArticleId) return;

    setIsDeleting(true);
    try {
      await articlesApi.delete(deleteArticleId);
      setArticles(articles.filter((a) => a.id !== deleteArticleId));
      if (stats) {
        setStats({ ...stats, total: stats.total - 1 });
      }
      toast({
        title: t('articles.deleted'),
        description: t('articles.deletedDesc'),
      });
    } catch (error) {
      console.error('Failed to delete article:', error);
      toast({
        title: t('common.error'),
        description: t('articles.deleteError'),
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
      setDeleteArticleId(null);
    }
  };

  const handleStatusChange = async (articleId: string, newStatus: string) => {
    try {
      await articlesApi.updateStatus(articleId, newStatus);
      setArticles(
        articles.map((a) =>
          a.id === articleId ? { ...a, status: newStatus as ArticleListItem['status'] } : a
        )
      );
      toast({
        title: t('articles.saved'),
      });
    } catch (error) {
      console.error('Failed to update status:', error);
      toast({
        title: t('common.error'),
        variant: 'destructive',
      });
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft':
        return <FileEdit className="h-3 w-3" />;
      case 'private':
        return <Lock className="h-3 w-3" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'private':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      default:
        return 'bg-green-500/20 text-green-400 border-green-500/30';
    }
  };

  return (
    <Card className="bg-card/50 backdrop-blur border-border">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {isOwner ? t('articles.myArticles') : t('articles.title')}
          </CardTitle>
          {isOwner && stats && (
            <p className="text-sm text-muted-foreground mt-1">
              {t('articles.stats.total')}: {stats.total} • {t('articles.stats.published')}: {stats.published} • {t('articles.stats.drafts')}: {stats.drafts}
            </p>
          )}
        </div>
        {isOwner && canCreate && (
          <Link to="/articles/new">
            <Button size="sm" className="bg-gradient-primary text-primary-foreground">
              <Plus className="h-4 w-4 mr-1" />
              {t('articles.create')}
            </Button>
          </Link>
        )}
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">
              {isOwner ? t('articles.noArticlesDesc') : t('articles.noArticles')}
            </p>
            {isOwner && canCreate && (
              <Link to="/articles/new">
                <Button className="mt-4" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  {t('articles.create')}
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {articles.map((article, index) => (
              <motion.div
                key={article.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center gap-4 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                {/* Thumbnail */}
                <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                  {article.header_image ? (
                    <img
                      src={article.header_image}
                      alt={article.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                      <FileText className="h-6 w-6 text-primary/50" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <Link to={`/articles/${article.slug}`} className="hover:text-primary">
                    <h4 className="font-medium truncate">{article.title}</h4>
                  </Link>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span>{formatDate(article.published_at || article.created_at)}</span>
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {article.views}
                    </span>
                  </div>
                </div>

                {/* Status */}
                <Badge variant="outline" className={getStatusColor(article.status)}>
                  {getStatusIcon(article.status)}
                  <span className="ml-1">{t(`articles.status.${article.status}`)}</span>
                </Badge>

                {/* Actions (owner only) */}
                {isOwner && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link to={`/articles/${article.id}/edit`}>
                          <Edit className="h-4 w-4 mr-2" />
                          {t('articles.edit')}
                        </Link>
                      </DropdownMenuItem>
                      {article.status !== 'published' && (
                        <DropdownMenuItem onClick={() => handleStatusChange(article.id, 'published')}>
                          <Eye className="h-4 w-4 mr-2" />
                          {t('articles.publish')}
                        </DropdownMenuItem>
                      )}
                      {article.status === 'published' && (
                        <DropdownMenuItem onClick={() => handleStatusChange(article.id, 'draft')}>
                          <FileEdit className="h-4 w-4 mr-2" />
                          {t('articles.status.draft')}
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => setDeleteArticleId(article.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        {t('articles.delete')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </motion.div>
            ))}

            {/* View all link */}
            {articles.length >= 10 && (
              <div className="text-center pt-2">
                <Link to={isOwner ? '/articles?my=true' : `/articles?author=${userId}`}>
                  <Button variant="link" className="text-primary">
                    {t('common.viewAll')}
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </CardContent>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteArticleId} onOpenChange={() => setDeleteArticleId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('articles.deleteConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('articles.deleteConfirmDesc')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground"
              disabled={isDeleting}
            >
              {isDeleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {t('articles.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};
