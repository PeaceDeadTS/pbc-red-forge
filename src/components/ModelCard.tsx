import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Download, Heart, Star, Eye } from 'lucide-react';
import { Model } from '@/types/model';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface ModelCardProps {
  model: Model;
  index?: number;
}

export const ModelCard = ({ model, index = 0 }: ModelCardProps) => {
  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      whileHover={{ y: -8 }}
      className="group"
    >
      <Link to={`/model/${model.id}`}>
        <div className="relative overflow-hidden rounded-xl bg-card border border-border/40 shadow-card transition-all duration-300 hover:border-primary/40 hover:shadow-glow">
          {/* Cover Image */}
          <div className="relative aspect-[3/4] overflow-hidden bg-muted">
            <img
              src={model.coverImage}
              alt={model.name}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
            
            {/* Overlay on hover */}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="absolute bottom-4 left-4 right-4 space-y-2">
                <div className="flex flex-wrap gap-1">
                  {model.tags.slice(0, 3).map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="bg-primary/20 text-primary border-primary/30 text-xs"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            {/* Type Badge */}
            <div className="absolute top-3 right-3">
              <Badge className={cn(
                "bg-card/90 backdrop-blur-sm border-border/40",
                model.type === 'checkpoint' && "border-primary/40 text-primary",
                model.type === 'lora' && "border-secondary/40 text-secondary"
              )}>
                {model.type.toUpperCase()}
              </Badge>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 space-y-3">
            {/* Title & Creator */}
            <div className="space-y-2">
              <h3 className="font-display font-semibold text-lg line-clamp-1 group-hover:text-primary transition-colors">
                {model.name}
              </h3>
              
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6 border border-border/40">
                  <AvatarImage src={model.creator.avatar} alt={model.creator.name} />
                  <AvatarFallback>{model.creator.name[0]}</AvatarFallback>
                </Avatar>
                <span className="text-sm text-muted-foreground">
                  {model.creator.name}
                </span>
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center justify-between text-sm text-muted-foreground pt-2 border-t border-border/40">
              <div className="flex items-center gap-1">
                <Download className="h-4 w-4" />
                <span>{formatNumber(model.stats.downloads)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Heart className="h-4 w-4 fill-destructive text-destructive" />
                <span>{formatNumber(model.stats.likes)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-secondary text-secondary" />
                <span>{model.stats.rating}</span>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};
