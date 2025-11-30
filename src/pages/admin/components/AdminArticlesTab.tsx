import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FileText, Eye, Edit, Trash2, Loader2, Search, MoreVertical, Lock, FileEdit, Globe } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { articlesApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import type { ArticleListItem } from '@/types/article';

export const AdminArticlesTab = () => {
  const { t } = useTranslation();
  const { toast } = useToast();

  const [articles, setArticles] = useState<ArticleListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [deleteArticleId, setDeleteArticleId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const limit = 20;

  useEffect(() => {
    const fetchArticles = async () => {
      setIsLoading(true);
      try {
        const res = await articlesApi.getArticles({
          status: statusFilter,
          search: search || undefined,
          limit,
          offset: (page - 1) * limit,
          sort: 'created_at',
          order: 'desc',
        });
        setArticles(res.data.articles);
        setTotal(res.data.pagination.total);
      } catch (error) {
        console.error('Failed to fetch articles:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchArticles();
  }, [page, statusFilter, search]);

  const handleDelete = async () => {
    if (!deleteArticleId) return;

    setIsDeleting(true);
    try {
      await articlesApi.delete(deleteArticleId);
      setArticles(articles.filter((a) => a.id !== deleteArticleId));
      setTotal(total - 1);
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
        title: t('admin.articles.statusUpdated'),
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
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return (
          <Badge variant="outline" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
            <FileEdit className="h-3 w-3 mr-1" />
            {t('articles.status.draft')}
          </Badge>
        );
      case 'private':
        return (
          <Badge variant="outline" className="bg-purple-500/20 text-purple-400 border-purple-500/30">
            <Lock className="h-3 w-3 mr-1" />
            {t('articles.status.private')}
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30">
            <Globe className="h-3 w-3 mr-1" />
            {t('articles.status.published')}
          </Badge>
        );
    }
  };

  const totalPages = Math.ceil(total / limit);

  // Stats
  const stats = {
    total,
    published: articles.filter((a) => a.status === 'published').length,
    drafts: articles.filter((a) => a.status === 'draft').length,
    private: articles.filter((a) => a.status === 'private').length,
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('admin.articles.totalArticles')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('articles.stats.published')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">{stats.published}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('articles.stats.drafts')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-400">{stats.drafts}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('articles.stats.private')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-400">{stats.private}</div>
          </CardContent>
        </Card>
      </div>

      {/* Articles Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {t('admin.articles.manageArticles')}
          </CardTitle>
          <CardDescription>{t('admin.articles.manageArticlesDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('admin.articles.searchPlaceholder')}
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-10"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(v) => {
                setStatusFilter(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={t('admin.articles.filterByStatus')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('admin.articles.allStatuses')}</SelectItem>
                <SelectItem value="published">{t('articles.status.published')}</SelectItem>
                <SelectItem value="draft">{t('articles.status.draft')}</SelectItem>
                <SelectItem value="private">{t('articles.status.private')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : articles.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">{t('articles.noArticles')}</p>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('admin.articles.article')}</TableHead>
                      <TableHead>{t('admin.articles.author')}</TableHead>
                      <TableHead>{t('admin.articles.status')}</TableHead>
                      <TableHead>{t('admin.articles.views')}</TableHead>
                      <TableHead>{t('admin.articles.date')}</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {articles.map((article) => {
                      const authorInitials = (article.author.display_name || article.author.username)
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase()
                        .slice(0, 2);

                      return (
                        <TableRow key={article.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded overflow-hidden flex-shrink-0">
                                {article.header_image ? (
                                  <img
                                    src={article.header_image}
                                    alt={article.title}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full bg-muted flex items-center justify-center">
                                    <FileText className="h-5 w-5 text-muted-foreground" />
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0">
                                <Link
                                  to={`/articles/${article.slug}`}
                                  className="font-medium hover:text-primary truncate block"
                                >
                                  {article.title}
                                </Link>
                                <p className="text-xs text-muted-foreground truncate">
                                  /{article.slug}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Link
                              to={`/profile/${article.author.id}`}
                              className="flex items-center gap-2 hover:text-primary"
                            >
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={article.author.avatar_url || undefined} />
                                <AvatarFallback className="text-xs">
                                  {authorInitials}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm">
                                {article.author.display_name || article.author.username}
                              </span>
                            </Link>
                          </TableCell>
                          <TableCell>{getStatusBadge(article.status)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Eye className="h-3 w-3" />
                              {article.views}
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {formatDate(article.published_at || article.created_at)}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                  <Link to={`/articles/${article.slug}`}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    {t('admin.articles.view')}
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                  <Link to={`/articles/${article.id}/edit`}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    {t('articles.edit')}
                                  </Link>
                                </DropdownMenuItem>
                                {article.status !== 'published' && (
                                  <DropdownMenuItem
                                    onClick={() => handleStatusChange(article.id, 'published')}
                                  >
                                    <Globe className="h-4 w-4 mr-2" />
                                    {t('articles.publish')}
                                  </DropdownMenuItem>
                                )}
                                {article.status === 'published' && (
                                  <DropdownMenuItem
                                    onClick={() => handleStatusChange(article.id, 'draft')}
                                  >
                                    <FileEdit className="h-4 w-4 mr-2" />
                                    {t('admin.articles.unpublish')}
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
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                  >
                    {t('common.previous')}
                  </Button>
                  <div className="flex items-center gap-2 px-4 text-sm text-muted-foreground">
                    {t('common.page')} {page} / {totalPages}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === totalPages}
                    onClick={() => setPage(page + 1)}
                  >
                    {t('common.next')}
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

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
    </div>
  );
};
