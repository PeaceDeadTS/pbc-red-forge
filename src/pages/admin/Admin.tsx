import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Shield, Users, FileText, Settings, Activity, AlertTriangle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { AdminUsersTab } from './components/AdminUsersTab';
import { AdminContentTab } from './components/AdminContentTab';
import { AdminSettingsTab } from './components/AdminSettingsTab';
import { AdminSystemTab } from './components/AdminSystemTab';

const Admin = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('users');

  const isAdmin = user?.groups?.includes('administrator');

  // Redirect non-admins
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !isAdmin)) {
      navigate('/');
    }
  }, [isLoading, isAuthenticated, isAdmin, navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="min-h-screen pt-20 pb-12">
        <div className="container mx-auto px-4">
          <Card className="max-w-md mx-auto mt-12">
            <CardContent className="pt-6 text-center">
              <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">{t('admin.accessDenied')}</h2>
              <p className="text-muted-foreground">{t('admin.adminOnly')}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="rounded-lg bg-gradient-to-r from-red-600 to-red-500 p-2 shadow-lg shadow-red-500/20">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-3xl font-display font-bold bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
              {t('admin.title')}
            </h1>
          </div>
          <p className="text-muted-foreground">{t('admin.subtitle')}</p>
        </motion.div>

        {/* Admin Tabs */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
              <TabsTrigger value="users" className="gap-2">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">{t('admin.tabs.users')}</span>
              </TabsTrigger>
              <TabsTrigger value="content" className="gap-2">
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">{t('admin.tabs.content')}</span>
              </TabsTrigger>
              <TabsTrigger value="settings" className="gap-2">
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">{t('admin.tabs.settings')}</span>
              </TabsTrigger>
              <TabsTrigger value="system" className="gap-2">
                <Activity className="h-4 w-4" />
                <span className="hidden sm:inline">{t('admin.tabs.system')}</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="users">
              <AdminUsersTab />
            </TabsContent>

            <TabsContent value="content">
              <AdminContentTab />
            </TabsContent>

            <TabsContent value="settings">
              <AdminSettingsTab />
            </TabsContent>

            <TabsContent value="system">
              <AdminSystemTab />
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
};

export default Admin;
