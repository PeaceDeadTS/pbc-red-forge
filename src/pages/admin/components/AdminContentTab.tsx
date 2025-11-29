import { useTranslation } from 'react-i18next';
import { 
  FileText, Image, Box, Tag, Flag, MessageSquare, 
  AlertTriangle, Clock, CheckCircle, XCircle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export const AdminContentTab = () => {
  const { t } = useTranslation();

  // Placeholder stats - will be connected to real API later
  const stats = {
    totalModels: 0,
    pendingReview: 0,
    flaggedContent: 0,
    totalComments: 0,
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('admin.content.totalModels')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalModels}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('admin.content.pendingReview')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-400">{stats.pendingReview}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('admin.content.flaggedContent')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-400">{stats.flaggedContent}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('admin.content.totalComments')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalComments}</div>
          </CardContent>
        </Card>
      </div>

      {/* Content Management Tabs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {t('admin.content.manageContent')}
          </CardTitle>
          <CardDescription>{t('admin.content.manageContentDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="models" className="space-y-4">
            <TabsList>
              <TabsTrigger value="models" className="gap-2">
                <Box className="h-4 w-4" />
                {t('admin.content.models')}
              </TabsTrigger>
              <TabsTrigger value="images" className="gap-2">
                <Image className="h-4 w-4" />
                {t('admin.content.images')}
              </TabsTrigger>
              <TabsTrigger value="tags" className="gap-2">
                <Tag className="h-4 w-4" />
                {t('admin.content.tags')}
              </TabsTrigger>
              <TabsTrigger value="reports" className="gap-2">
                <Flag className="h-4 w-4" />
                {t('admin.content.reports')}
              </TabsTrigger>
              <TabsTrigger value="comments" className="gap-2">
                <MessageSquare className="h-4 w-4" />
                {t('admin.content.comments')}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="models">
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Box className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">{t('admin.content.modelsPlaceholder')}</h3>
                <p className="text-muted-foreground max-w-md">
                  {t('admin.content.modelsPlaceholderDesc')}
                </p>
              </div>
            </TabsContent>

            <TabsContent value="images">
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Image className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">{t('admin.content.imagesPlaceholder')}</h3>
                <p className="text-muted-foreground max-w-md">
                  {t('admin.content.imagesPlaceholderDesc')}
                </p>
              </div>
            </TabsContent>

            <TabsContent value="tags">
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Tag className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">{t('admin.content.tagsPlaceholder')}</h3>
                <p className="text-muted-foreground max-w-md">
                  {t('admin.content.tagsPlaceholderDesc')}
                </p>
              </div>
            </TabsContent>

            <TabsContent value="reports">
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Flag className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">{t('admin.content.reportsPlaceholder')}</h3>
                <p className="text-muted-foreground max-w-md">
                  {t('admin.content.reportsPlaceholderDesc')}
                </p>
              </div>
            </TabsContent>

            <TabsContent value="comments">
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">{t('admin.content.commentsPlaceholder')}</h3>
                <p className="text-muted-foreground max-w-md">
                  {t('admin.content.commentsPlaceholderDesc')}
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>{t('admin.content.quickActions')}</CardTitle>
          <CardDescription>{t('admin.content.quickActionsDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" disabled>
              <Clock className="h-5 w-5" />
              <span>{t('admin.content.reviewQueue')}</span>
              <Badge variant="secondary">0</Badge>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" disabled>
              <Flag className="h-5 w-5 text-red-400" />
              <span>{t('admin.content.flaggedItems')}</span>
              <Badge variant="secondary">0</Badge>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" disabled>
              <CheckCircle className="h-5 w-5 text-green-400" />
              <span>{t('admin.content.approveAll')}</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" disabled>
              <XCircle className="h-5 w-5 text-orange-400" />
              <span>{t('admin.content.bulkActions')}</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
