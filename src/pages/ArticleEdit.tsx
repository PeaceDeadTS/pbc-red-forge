import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, Eye, Loader2, Image as ImageIcon, X, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArticleEditor } from '@/components/editor/ArticleEditor';
import { articlesApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { Article, ArticleStatus } from '@/types/article';

const ArticleEdit = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();

  const isNew = !id || id === 'new';

  const [isLoading, setIsLoading] = useState(!isNew);
  const [isSaving, setIsSaving] = useState(false);
  const [canCreate, setCanCreate] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [headerImage, setHeaderImage] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState<ArticleStatus>('draft');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  // Check permissions
  useEffect(() => {
    const checkPermissions = async () => {
      if (!isAuthenticated) {
        navigate('/articles');
        return;
      }
      try {
        const res = await articlesApi.canCreate();
        if (!res.data.canCreate) {
          toast({
            title: t('common.error'),
            description: t('articles.noPermission'),
            variant: 'destructive',
          });
          navigate('/articles');
        }
        setCanCreate(res.data.canCreate);
      } catch {
        navigate('/articles');
      }
    };
    checkPermissions();
  }, [isAuthenticated, navigate, t, toast]);

  // Load existing article
  useEffect(() => {
    const fetchArticle = async () => {
      if (isNew || !id) return;

      setIsLoading(true);
      try {
        const res = await articlesApi.getArticle(id);
        const article: Article = res.data;

        // Check if user can edit
        const isAuthor = user?.id === article.author.id;
        const isAdmin = user?.groups?.includes('administrator');
        if (!isAuthor && !isAdmin) {
          toast({
            title: t('common.error'),
            description: t('articles.noPermission'),
            variant: 'destructive',
          });
          navigate('/articles');
          return;
        }

        setTitle(article.title);
        setSlug(article.slug);
        setHeaderImage(article.header_image || '');
        setExcerpt(article.excerpt || '');
        setContent(article.content);
        setStatus(article.status);
        setTags(article.tags);
      } catch (error) {
        console.error('Failed to fetch article:', error);
        toast({
          title: t('common.error'),
          description: t('articles.notFound'),
          variant: 'destructive',
        });
        navigate('/articles');
      } finally {
        setIsLoading(false);
      }
    };

    fetchArticle();
  }, [id, isNew, user, navigate, t, toast]);

  // Auto-generate slug from title
  const generateSlug = (text: string) => {
    const base = text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();

    const normalized = base.length === 0 ? 'article' : base;

    const minLengthSlug =
      normalized.length >= 3
        ? normalized
        : normalized.repeat(Math.ceil(3 / normalized.length)).slice(0, 3);

    return minLengthSlug.slice(0, 100);
  };

  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (isNew && !slug) {
      setSlug(generateSlug(value));
    }
  };

  const handleAddTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !tags.includes(tag) && tags.length < 10) {
      setTags([...tags, tag]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleSave = async (saveStatus?: ArticleStatus) => {
    if (!title.trim()) {
      toast({
        title: t('common.error'),
        description: t('articles.titleRequired'),
        variant: 'destructive',
      });
      return;
    }

    if (!content.trim()) {
      toast({
        title: t('common.error'),
        description: t('articles.contentRequired'),
        variant: 'destructive',
      });
      return;
    }

    if (slug && slug.length < 3) {
      toast({
        title: t('common.error'),
        description: t('articles.slugTooShort'),
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      const data = {
        title,
        slug: slug || undefined,
        header_image: headerImage || null,
        excerpt: excerpt || null,
        content,
        tags,
        status: saveStatus || status,
      };

      let savedArticle;
      if (isNew) {
        const res = await articlesApi.create(data);
        savedArticle = res.data;
      } else {
        const res = await articlesApi.update(id!, data);
        savedArticle = res.data;
      }

      toast({
        title: t('articles.saved'),
        description: t('articles.savedDesc'),
      });

      navigate(`/articles/${savedArticle.slug}`);
    } catch (error: unknown) {
      console.error('Failed to save article:', error);
      const errorMessage = (error as { response?: { data?: { error?: string } } })?.response?.data?.error || t('articles.saveError');
      toast({
        title: t('common.error'),
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen pt-24 pb-12 flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="container mx-auto px-4 max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t('common.back')}
              </Button>
              <h1 className="text-2xl font-display font-bold">
                {isNew ? t('articles.createNew') : t('articles.editArticle')}
              </h1>
            </div>

            <div className="flex items-center gap-2">
              {/* Save as draft */}
              <Button
                variant="outline"
                onClick={() => handleSave('draft')}
                disabled={isSaving}
              >
                {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                {t('articles.saveDraft')}
              </Button>

              {/* Publish */}
              <Button
                className="bg-gradient-primary text-primary-foreground hover:shadow-glow"
                onClick={() => handleSave('published')}
                disabled={isSaving}
              >
                {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Eye className="h-4 w-4 mr-2" />}
                {t('articles.publish')}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Title */}
              <div>
                <Label htmlFor="title">{t('articles.titleLabel')}</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder={t('articles.titlePlaceholder')}
                  className="mt-1 text-lg"
                />
              </div>

              {/* Editor */}
              <div>
                <Label>{t('articles.contentLabel')}</Label>
                <div className="mt-1">
                  <ArticleEditor
                    content={content}
                    onChange={setContent}
                    placeholder={t('articles.contentPlaceholder')}
                  />
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Status */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">{t('articles.statusLabel')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Select value={status} onValueChange={(v) => setStatus(v as ArticleStatus)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">{t('articles.status.draft')}</SelectItem>
                      <SelectItem value="published">{t('articles.status.published')}</SelectItem>
                      <SelectItem value="private">{t('articles.status.private')}</SelectItem>
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              {/* Slug */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">{t('articles.slugLabel')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Input
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    placeholder={t('articles.slugPlaceholder')}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('articles.slugHint')}
                  </p>
                </CardContent>
              </Card>

              {/* Header Image */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">{t('articles.headerImageLabel')}</CardTitle>
                </CardHeader>
                <CardContent>
                  {headerImage && (
                    <div className="relative mb-3">
                      <img
                        src={headerImage}
                        alt="Header"
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 h-6 w-6"
                        onClick={() => setHeaderImage('')}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                  <Input
                    value={headerImage}
                    onChange={(e) => setHeaderImage(e.target.value)}
                    placeholder={t('articles.headerImagePlaceholder')}
                  />
                </CardContent>
              </Card>

              {/* Excerpt */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">{t('articles.excerptLabel')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={excerpt}
                    onChange={(e) => setExcerpt(e.target.value)}
                    placeholder={t('articles.excerptPlaceholder')}
                    rows={3}
                    maxLength={500}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {excerpt.length}/500
                  </p>
                </CardContent>
              </Card>

              {/* Tags */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">{t('articles.tagsLabel')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2 mb-2">
                    <Input
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={handleTagKeyDown}
                      placeholder={t('articles.tagPlaceholder')}
                    />
                    <Button variant="outline" size="icon" onClick={handleAddTag}>
                      <Tag className="h-4 w-4" />
                    </Button>
                  </div>
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="gap-1">
                          {tag}
                          <X
                            className="h-3 w-3 cursor-pointer hover:text-destructive"
                            onClick={() => handleRemoveTag(tag)}
                          />
                        </Badge>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    {t('articles.tagsHint', { count: 10 - tags.length })}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ArticleEdit;
