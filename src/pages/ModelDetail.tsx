import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Download, Heart, Star, ChevronLeft, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { mockModels } from '@/data/mockModels';
import { cn } from '@/lib/utils';

const ModelDetail = () => {
  const { id } = useParams();
  const { t } = useTranslation();
  const model = mockModels.find((m) => m.id === id);

  if (!model) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-display font-bold text-muted-foreground">
            Model not found
          </h1>
          <Link to="/browse">
            <Button>
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Browse
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="container mx-auto px-4">
        {/* Back Button */}
        <Link to="/browse">
          <Button variant="ghost" className="mb-6">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Browse
          </Button>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Images */}
          <div className="lg:col-span-2 space-y-6">
            {/* Main Image */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="relative aspect-video rounded-xl overflow-hidden bg-card border border-border/40 shadow-card"
            >
              <img
                src={model.coverImage}
                alt={model.name}
                className="w-full h-full object-cover"
              />
            </motion.div>

            {/* Gallery */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {model.images.slice(1).map((image, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="aspect-square rounded-lg overflow-hidden bg-card border border-border/40 cursor-pointer hover:border-primary/40 transition-colors"
                >
                  <img
                    src={image}
                    alt={`${model.name} ${index + 1}`}
                    className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                  />
                </motion.div>
              ))}
            </div>

            {/* Tabs */}
            <Tabs defaultValue="description" className="w-full">
              <TabsList className="w-full justify-start bg-card border border-border/40">
                <TabsTrigger value="description">{t('model.description')}</TabsTrigger>
                <TabsTrigger value="examples">{t('model.examples')}</TabsTrigger>
                <TabsTrigger value="versions">{t('model.versions')}</TabsTrigger>
              </TabsList>
              <TabsContent value="description" className="space-y-4 mt-6">
                <p className="text-muted-foreground leading-relaxed">
                  {model.description}
                </p>
                <div className="space-y-2">
                  <h3 className="font-semibold">{t('model.tags')}</h3>
                  <div className="flex flex-wrap gap-2">
                    {model.tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="bg-primary/10 text-primary border-primary/30"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="examples" className="mt-6">
                <div className="grid grid-cols-2 gap-4">
                  {model.images.map((image, index) => (
                    <div
                      key={index}
                      className="aspect-square rounded-lg overflow-hidden bg-card border border-border/40"
                    >
                      <img
                        src={image}
                        alt={`Example ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </TabsContent>
              <TabsContent value="versions" className="mt-6">
                <div className="space-y-4">
                  {model.versions.map((version) => (
                    <div
                      key={version.id}
                      className="p-4 rounded-lg bg-card border border-border/40 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold">{version.name}</h4>
                        <Badge variant="outline">{version.baseModel}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Released: {new Date(version.createdAt).toLocaleDateString()}
                      </p>
                      <Button size="sm" className="w-full bg-gradient-primary">
                        <Download className="mr-2 h-4 w-4" />
                        {t('model.download')}
                      </Button>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Column - Info & Actions */}
          <div className="space-y-6">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Badge className={cn(
                  "mb-2",
                  model.type === 'checkpoint' && "bg-primary/10 text-primary border-primary/30",
                  model.type === 'lora' && "bg-secondary/10 text-secondary border-secondary/30"
                )}>
                  {model.type.toUpperCase()}
                </Badge>
                <h1 className="text-3xl font-display font-bold">{model.name}</h1>
              </div>

              {/* Creator */}
              <Link to={`/profile/${model.creator.id}`} className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border/40 hover:border-primary/40 transition-colors group">
                <Avatar className="h-12 w-12 border-2 border-border/40 group-hover:border-primary/40 transition-colors">
                  <AvatarImage src={model.creator.avatar} alt={model.creator.name} />
                  <AvatarFallback>{model.creator.name[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm text-muted-foreground">{t('model.creator')}</p>
                  <p className="font-semibold group-hover:text-primary transition-colors">
                    {model.creator.name}
                  </p>
                </div>
              </Link>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="grid grid-cols-2 gap-4"
            >
              <div className="p-4 rounded-lg bg-card border border-border/40 text-center">
                <Download className="h-6 w-6 mx-auto mb-2 text-primary" />
                <p className="text-2xl font-bold">{formatNumber(model.stats.downloads)}</p>
                <p className="text-sm text-muted-foreground">{t('model.downloads')}</p>
              </div>
              <div className="p-4 rounded-lg bg-card border border-border/40 text-center">
                <Heart className="h-6 w-6 mx-auto mb-2 text-destructive fill-destructive" />
                <p className="text-2xl font-bold">{formatNumber(model.stats.likes)}</p>
                <p className="text-sm text-muted-foreground">{t('model.likes')}</p>
              </div>
              <div className="p-4 rounded-lg bg-card border border-border/40 text-center">
                <Star className="h-6 w-6 mx-auto mb-2 text-secondary fill-secondary" />
                <p className="text-2xl font-bold">{model.stats.rating}</p>
                <p className="text-sm text-muted-foreground">Rating</p>
              </div>
              <div className="p-4 rounded-lg bg-card border border-border/40 text-center">
                <ExternalLink className="h-6 w-6 mx-auto mb-2 text-accent" />
                <p className="text-2xl font-bold">{formatNumber(model.stats.views)}</p>
                <p className="text-sm text-muted-foreground">Views</p>
              </div>
            </motion.div>

            {/* Actions */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="space-y-3"
            >
              <Button className="w-full bg-gradient-primary text-primary-foreground hover:shadow-glow">
                <Download className="mr-2 h-5 w-5" />
                {t('model.download')}
              </Button>
              <Button variant="outline" className="w-full border-secondary/40 text-secondary hover:bg-secondary/10">
                <Heart className="mr-2 h-5 w-5" />
                Add to Favorites
              </Button>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModelDetail;
