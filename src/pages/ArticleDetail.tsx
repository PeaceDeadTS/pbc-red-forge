import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Calendar, Eye, Tag, Edit, Trash2, ArrowLeft, Loader2, User, Lock, FileEdit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { articlesApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { Article } from '@/types/article';

const ArticleDetail = () => {
  const { t } = useTranslation();
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();

  const [article, setArticle] = useState<Article | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  const isAuthor = user && article && user.id === article.author.id;
  const isAdmin = user?.groups?.includes('administrator');
  const canEdit = isAuthor || isAdmin;

  useEffect(() => {
    const fetchArticle = async () => {
      if (!slug) return;
      
      setIsLoading(true);
      try {
        const res = await articlesApi.getArticle(slug);
        setArticle(res.data);
      } catch (error) {
        console.error('Failed to fetch article:', error);
        setArticle(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchArticle();
  }, [slug]);

  const handleDelete = async () => {
    if (!article) return;
    
    setIsDeleting(true);
    try {
      await articlesApi.delete(article.id);
      toast({
        title: t('articles.deleted'),
        description: t('articles.deletedDesc'),
      });
      navigate('/articles');
    } catch (error) {
      console.error('Failed to delete article:', error);
      toast({
        title: t('common.error'),
        description: t('articles.deleteError'),
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen pt-24 pb-12 flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen pt-24 pb-12">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-display font-bold text-muted-foreground">
            {t('articles.notFound')}
          </h1>
          <p className="text-muted-foreground mt-4">
            {t('articles.notFoundDesc')}
          </p>
          <Link to="/articles">
            <Button className="mt-6">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('articles.backToArticles')}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const authorInitials = (article.author.display_name || article.author.username)
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // Parse content (assuming JSON from TipTap)
  let contentHtml = '';
  try {
    const contentJson = JSON.parse(article.content);
    // Simple rendering - in production use TipTap's generateHTML
    contentHtml = renderTipTapContent(contentJson);
  } catch {
    // If not JSON, treat as plain text/HTML
    contentHtml = article.content;
  }

  return (
    <div className="min-h-screen pt-24 pb-12">
      {/* Header Image */}
      {article.header_image && (
        <div className="relative h-[40vh] md:h-[50vh] w-full overflow-hidden">
          <img
            src={article.header_image}
            alt={article.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        </div>
      )}

      <div className="container mx-auto px-4 max-w-4xl">
        <motion.article
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className={article.header_image ? '-mt-32 relative z-10' : ''}
        >
          {/* Back button */}
          <Link to="/articles" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('articles.backToArticles')}
          </Link>

          {/* Status badge */}
          {article.status !== 'published' && (
            <div className="mb-4">
              <Badge variant="secondary" className="bg-yellow-500/90 text-yellow-950">
                {article.status === 'draft' && <FileEdit className="h-3 w-3 mr-1" />}
                {article.status === 'private' && <Lock className="h-3 w-3 mr-1" />}
                {t(`articles.status.${article.status}`)}
              </Badge>
            </div>
          )}

          {/* Title */}
          <h1 className="text-4xl md:text-5xl font-display font-bold mb-6">
            {article.title}
          </h1>

          {/* Meta info */}
          <div className="flex flex-wrap items-center gap-4 mb-8 text-muted-foreground">
            {/* Author */}
            <Link to={`/profile/${article.author.id}`} className="flex items-center gap-2 hover:text-foreground">
              <Avatar className="h-10 w-10 border-2 border-primary/20">
                <AvatarImage src={article.author.avatar_url || undefined} />
                <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                  {authorInitials}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-foreground">
                  {article.author.display_name || article.author.username}
                </p>
                <p className="text-sm">@{article.author.username}</p>
              </div>
            </Link>

            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>{formatDate(article.published_at || article.created_at)}</span>
            </div>

            <div className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              <span>{article.views} {t('articles.views')}</span>
            </div>
          </div>

          {/* Tags */}
          {article.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-8">
              {article.tags.map((tag) => (
                <Link key={tag} to={`/articles?tag=${tag}`}>
                  <Badge variant="secondary" className="hover:bg-primary/80 cursor-pointer">
                    <Tag className="h-3 w-3 mr-1" />
                    {tag}
                  </Badge>
                </Link>
              ))}
            </div>
          )}

          {/* Actions for author/admin */}
          {canEdit && (
            <div className="flex gap-2 mb-8">
              <Link to={`/articles/${article.id}/edit`}>
                <Button variant="outline">
                  <Edit className="h-4 w-4 mr-2" />
                  {t('articles.edit')}
                </Button>
              </Link>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" disabled={isDeleting}>
                    {isDeleting ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4 mr-2" />
                    )}
                    {t('articles.delete')}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t('articles.deleteConfirmTitle')}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {t('articles.deleteConfirmDesc')}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                      {t('articles.delete')}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}

          {/* Content */}
          <Card className="bg-card/50 backdrop-blur border-border">
            <CardContent className="pt-6">
              <div 
                className="prose prose-invert prose-lg max-w-none
                  prose-headings:font-display prose-headings:text-foreground
                  prose-p:text-muted-foreground prose-p:leading-relaxed
                  prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                  prose-strong:text-foreground
                  prose-code:text-primary prose-code:bg-muted prose-code:px-1 prose-code:rounded
                  prose-pre:bg-muted prose-pre:border prose-pre:border-border
                  prose-blockquote:border-l-primary prose-blockquote:text-muted-foreground
                  prose-img:rounded-lg prose-img:shadow-lg"
                dangerouslySetInnerHTML={{ __html: contentHtml }}
              />
            </CardContent>
          </Card>

          {/* Author card */}
          <Card className="mt-8 bg-card/50 backdrop-blur border-border">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <Link to={`/profile/${article.author.id}`}>
                  <Avatar className="h-16 w-16 border-2 border-primary/20">
                    <AvatarImage src={article.author.avatar_url || undefined} />
                    <AvatarFallback className="text-xl bg-gradient-primary text-primary-foreground">
                      {authorInitials}
                    </AvatarFallback>
                  </Avatar>
                </Link>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-1">{t('articles.writtenBy')}</p>
                  <Link to={`/profile/${article.author.id}`} className="hover:text-primary">
                    <h3 className="text-xl font-semibold">
                      {article.author.display_name || article.author.username}
                    </h3>
                  </Link>
                  <p className="text-muted-foreground">@{article.author.username}</p>
                </div>
                <Link to={`/profile/${article.author.id}`}>
                  <Button variant="outline">
                    <User className="h-4 w-4 mr-2" />
                    {t('articles.viewProfile')}
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.article>
      </div>
    </div>
  );
};

// Simple TipTap content renderer
// In production, use @tiptap/html or generateHTML from TipTap
function renderTipTapContent(json: { type: string; content?: unknown[] }): string {
  if (!json || !json.content) return '';

  const renderNode = (node: { type: string; content?: unknown[]; text?: string; attrs?: Record<string, unknown>; marks?: { type: string; attrs?: Record<string, unknown> }[] }): string => {
    switch (node.type) {
      case 'doc':
        return (node.content || []).map((n) => renderNode(n as typeof node)).join('');
      case 'paragraph':
        return `<p>${(node.content || []).map((n) => renderNode(n as typeof node)).join('')}</p>`;
      case 'heading':
        const level = (node.attrs?.level as number) || 1;
        return `<h${level}>${(node.content || []).map((n) => renderNode(n as typeof node)).join('')}</h${level}>`;
      case 'text':
        let text = node.text || '';
        if (node.marks) {
          for (const mark of node.marks) {
            switch (mark.type) {
              case 'bold':
                text = `<strong>${text}</strong>`;
                break;
              case 'italic':
                text = `<em>${text}</em>`;
                break;
              case 'code':
                text = `<code>${text}</code>`;
                break;
              case 'link':
                text = `<a href="${mark.attrs?.href || '#'}" target="_blank" rel="noopener noreferrer">${text}</a>`;
                break;
              case 'underline':
                text = `<u>${text}</u>`;
                break;
              case 'strike':
                text = `<s>${text}</s>`;
                break;
            }
          }
        }
        return text;
      case 'bulletList':
        return `<ul>${(node.content || []).map((n) => renderNode(n as typeof node)).join('')}</ul>`;
      case 'orderedList':
        return `<ol>${(node.content || []).map((n) => renderNode(n as typeof node)).join('')}</ol>`;
      case 'listItem':
        return `<li>${(node.content || []).map((n) => renderNode(n as typeof node)).join('')}</li>`;
      case 'blockquote':
        return `<blockquote>${(node.content || []).map((n) => renderNode(n as typeof node)).join('')}</blockquote>`;
      case 'codeBlock':
        return `<pre><code>${(node.content || []).map((n) => renderNode(n as typeof node)).join('')}</code></pre>`;
      case 'image':
        return `<img src="${node.attrs?.src || ''}" alt="${node.attrs?.alt || ''}" />`;
      case 'horizontalRule':
        return '<hr />';
      case 'hardBreak':
        return '<br />';
      default:
        return (node.content || []).map((n) => renderNode(n as typeof node)).join('');
    }
  };

  return renderNode(json as Parameters<typeof renderNode>[0]);
}

export default ArticleDetail;
