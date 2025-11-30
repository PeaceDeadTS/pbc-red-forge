import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Eye, Calendar, Tag } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import type { ArticleListItem } from '@/types/article';

interface ArticleCardProps {
  article: ArticleListItem;
  index?: number;
}

export const ArticleCard = ({ article, index = 0 }: ArticleCardProps) => {
  const { t } = useTranslation();

  const authorInitials = (article.author.display_name || article.author.username)
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
    >
      <Link to={`/articles/${article.slug}`}>
        <div className="group relative overflow-hidden rounded-xl bg-card border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10">
          {/* Header Image */}
          <div className="aspect-square relative overflow-hidden">
            {article.header_image ? (
              <img
                src={article.header_image}
                alt={article.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                <span className="text-6xl font-display font-bold text-primary/30">
                  {article.title.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            
            {/* Overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            
            {/* Status badge for drafts/private */}
            {article.status !== 'published' && (
              <Badge
                variant="secondary"
                className="absolute top-3 right-3 bg-yellow-500/90 text-yellow-950"
              >
                {t(`articles.status.${article.status}`)}
              </Badge>
            )}

            {/* Tags */}
            {article.tags.length > 0 && (
              <div className="absolute top-3 left-3 flex flex-wrap gap-1 max-w-[80%]">
                {article.tags.slice(0, 3).map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="bg-primary/80 text-primary-foreground text-xs"
                  >
                    {tag}
                  </Badge>
                ))}
                {article.tags.length > 3 && (
                  <Badge variant="secondary" className="bg-muted/80 text-xs">
                    +{article.tags.length - 3}
                  </Badge>
                )}
              </div>
            )}

            {/* Content overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-4">
              {/* Author */}
              <div className="flex items-center gap-2 mb-2">
                <Avatar className="h-6 w-6 border border-white/20">
                  <AvatarImage src={article.author.avatar_url || undefined} />
                  <AvatarFallback className="text-xs bg-gradient-primary text-primary-foreground">
                    {authorInitials}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm text-white/80 truncate">
                  {article.author.display_name || article.author.username}
                </span>
              </div>

              {/* Date */}
              <div className="flex items-center gap-1 text-xs text-white/60 mb-2">
                <Calendar className="h-3 w-3" />
                <span>{formatDate(article.published_at || article.created_at)}</span>
              </div>

              {/* Title */}
              <h3 className="font-semibold text-white line-clamp-2 group-hover:text-primary transition-colors">
                {article.title}
              </h3>

              {/* Excerpt */}
              {article.excerpt && (
                <p className="text-sm text-white/70 line-clamp-2 mt-1">
                  {article.excerpt}
                </p>
              )}
            </div>
          </div>

          {/* Footer stats */}
          <div className="px-4 py-3 flex items-center justify-between border-t border-border/50 bg-card/50">
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Eye className="h-3.5 w-3.5" />
                <span>{article.views}</span>
              </div>
              {article.tags.length > 0 && (
                <div className="flex items-center gap-1">
                  <Tag className="h-3.5 w-3.5" />
                  <span>{article.tags.length}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};
