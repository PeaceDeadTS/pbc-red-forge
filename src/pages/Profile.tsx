import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { User, Settings, LogOut, Edit2, Calendar, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { usersApi, articlesApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { AuthModal } from '@/components/auth';
import { UserArticles } from '@/components/UserArticles';
import type { User as UserType } from '@/types/auth';

const Profile = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser, isAuthenticated, isLoading: authLoading, logout, updateUser } = useAuth();
  const { toast } = useToast();

  const [profileUser, setProfileUser] = useState<UserType | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const [editForm, setEditForm] = useState({
    display_name: '',
    bio: '',
  });
  const [canCreateArticles, setCanCreateArticles] = useState(false);

  // Determine which profile to show
  const targetUserId = id || currentUser?.id;

  useEffect(() => {
    const fetchProfile = async () => {
      if (!targetUserId) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await usersApi.getProfile(targetUserId);
        setProfileUser(response.data.user);
        setIsOwner(response.data.isOwner);
        setEditForm({
          display_name: response.data.user.display_name || '',
          bio: response.data.user.bio || '',
        });
      } catch {
        setProfileUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    if (!authLoading) {
      fetchProfile();
    }
  }, [targetUserId, authLoading]);

  // Check if user can create articles
  useEffect(() => {
    const checkCanCreate = async () => {
      if (!isAuthenticated || !isOwner) {
        setCanCreateArticles(false);
        return;
      }
      try {
        const res = await articlesApi.canCreate();
        setCanCreateArticles(res.data.canCreate);
      } catch {
        setCanCreateArticles(false);
      }
    };
    checkCanCreate();
  }, [isAuthenticated, isOwner]);

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const response = await usersApi.updateProfile(editForm);
      setProfileUser(response.data.user);
      updateUser(response.data.user);
      setIsEditing(false);
      toast({
        title: t('profile.profileUpdated'),
      });
    } catch {
      toast({
        title: t('auth.error'),
        description: t('common.error'),
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  // Show loading state
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen pt-24 pb-12 flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // If no ID and user is not authenticated, show sign-in prompt
  if (!id && !isAuthenticated) {
    return (
      <div className="min-h-screen pt-24 pb-12">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center space-y-8 max-w-2xl mx-auto min-h-[60vh] flex flex-col items-center justify-center"
          >
            <div className="relative">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-0 blur-3xl opacity-30"
              >
                <div className="w-32 h-32 bg-gradient-secondary rounded-full" />
              </motion.div>
              <User className="h-24 w-24 text-secondary relative z-10" />
            </div>

            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl font-display font-bold">
                {t('nav.profile')}
              </h1>
              <p className="text-xl text-muted-foreground">
                {t('profile.signInPrompt')}
              </p>
            </div>

            <Button
              className="bg-gradient-primary text-primary-foreground hover:shadow-glow"
              onClick={() => setAuthModalOpen(true)}
            >
              <Settings className="mr-2 h-5 w-5" />
              {t('nav.signIn')}
            </Button>
          </motion.div>
        </div>
        <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
      </div>
    );
  }

  // User not found
  if (!profileUser) {
    return (
      <div className="min-h-screen pt-24 pb-12">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-display font-bold text-muted-foreground">
            {t('profile.noUser')}
          </h1>
        </div>
      </div>
    );
  }

  const initials = (profileUser.display_name || profileUser.username)
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Card className="bg-card/50 backdrop-blur border-border">
            <CardHeader className="flex flex-row items-start gap-6">
              <Avatar className="h-24 w-24 border-4 border-primary/20">
                <AvatarImage src={profileUser.avatar_url || undefined} />
                <AvatarFallback className="text-2xl bg-gradient-primary text-primary-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 space-y-2">
                {isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="display_name">{t('auth.displayName')}</Label>
                      <Input
                        id="display_name"
                        value={editForm.display_name}
                        onChange={(e) => setEditForm({ ...editForm, display_name: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="bio">{t('profile.bio')}</Label>
                      <Textarea
                        id="bio"
                        value={editForm.bio}
                        onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                        className="mt-1"
                        rows={3}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleSaveProfile} disabled={isSaving}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {t('common.save')}
                      </Button>
                      <Button variant="outline" onClick={() => setIsEditing(false)}>
                        {t('common.cancel')}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-2xl">
                          {profileUser.display_name || profileUser.username}
                        </CardTitle>
                        <p className="text-muted-foreground">@{profileUser.username}</p>
                      </div>
                      {isOwner && (
                        <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                          <Edit2 className="h-4 w-4 mr-2" />
                          {t('profile.editProfile')}
                        </Button>
                      )}
                    </div>
                    {profileUser.bio && (
                      <p className="text-muted-foreground mt-4">{profileUser.bio}</p>
                    )}
                  </>
                )}
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>
                  {t('profile.memberSince')}{' '}
                  {profileUser.created_at
                    ? new Date(profileUser.created_at).toLocaleDateString()
                    : 'N/A'}
                </span>
              </div>

              {isOwner && (
                <div className="pt-4 border-t border-border space-y-4">
                  <h3 className="font-semibold">{t('profile.settings')}</h3>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" onClick={handleLogout}>
                      <LogOut className="h-4 w-4 mr-2" />
                      {t('auth.signOut')}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* User Articles Section */}
          {profileUser && (
            <div className="mt-6">
              <UserArticles
                userId={profileUser.id}
                isOwner={isOwner}
                canCreate={canCreateArticles}
              />
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Profile;
