import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Users as UsersIcon, Shield, Crown, Palette, ArrowUpDown, Calendar, User as UserIcon } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usersApi } from '@/lib/api';
import { User, UsersListResponse } from '@/types/auth';

type SortField = 'created_at' | 'username' | 'display_name';
type SortOrder = 'asc' | 'desc';

const groupIcons: Record<string, React.ReactNode> = {
  administrator: <Crown className="h-3 w-3" />,
  creator: <Palette className="h-3 w-3" />,
  user: <UserIcon className="h-3 w-3" />,
};

const groupColors: Record<string, string> = {
  administrator: 'bg-red-500/20 text-red-400 border-red-500/30',
  creator: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  user: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
};

const UserCard = ({ user }: { user: User }) => {
  const { t } = useTranslation();
  
  const userInitials = (user.display_name || user.username)
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Link to={`/profile/${user.id}`}>
        <Card className="group hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              <Avatar className="h-14 w-14 ring-2 ring-border group-hover:ring-primary/50 transition-all">
                <AvatarImage src={user.avatar_url || undefined} />
                <AvatarFallback className="bg-gradient-primary text-primary-foreground text-lg">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                    {user.display_name || user.username}
                  </h3>
                  {user.groups?.includes('administrator') && (
                    <Shield className="h-4 w-4 text-red-400 flex-shrink-0" />
                  )}
                </div>
                
                <p className="text-sm text-muted-foreground mb-2">@{user.username}</p>
                
                {user.bio && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{user.bio}</p>
                )}
                
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {user.groups?.map((group) => (
                    <Badge
                      key={group}
                      variant="outline"
                      className={`text-xs ${groupColors[group] || 'bg-gray-500/20 text-gray-400 border-gray-500/30'}`}
                    >
                      {groupIcons[group]}
                      <span className="ml-1">{t(`users.groups.${group}`, group)}</span>
                    </Badge>
                  ))}
                </div>
                
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>{t('users.memberSince')}: {formatDate(user.created_at)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
};

const Users = () => {
  const { t } = useTranslation();
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const { data, isLoading, error } = useQuery<UsersListResponse>({
    queryKey: ['users', sortField, sortOrder],
    queryFn: async () => {
      const response = await usersApi.getUsers({ sort: sortField, order: sortOrder, limit: 100 });
      return response.data;
    },
  });

  const toggleSortOrder = () => {
    setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
  };

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
            <div className="rounded-lg bg-gradient-primary p-2 shadow-glow">
              <UsersIcon className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-display font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              {t('users.title')}
            </h1>
          </div>
          <p className="text-muted-foreground">{t('users.subtitle')}</p>
        </motion.div>

        {/* Sorting Controls */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex flex-wrap items-center gap-4 mb-6"
        >
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{t('users.sortBy')}:</span>
            <Select value={sortField} onValueChange={(value) => setSortField(value as SortField)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at">{t('users.sortOptions.date')}</SelectItem>
                <SelectItem value="username">{t('users.sortOptions.username')}</SelectItem>
                <SelectItem value="display_name">{t('users.sortOptions.displayName')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={toggleSortOrder}
            className="gap-2"
          >
            <ArrowUpDown className="h-4 w-4" />
            {sortOrder === 'asc' ? t('users.ascending') : t('users.descending')}
          </Button>

          {data?.pagination && (
            <span className="text-sm text-muted-foreground ml-auto">
              {t('users.totalUsers', { count: data.pagination.total })}
            </span>
          )}
        </motion.div>

        {/* Users Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-destructive">{t('common.error')}</p>
          </div>
        ) : data?.users.length === 0 ? (
          <div className="text-center py-12">
            <UsersIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">{t('users.noUsers')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data?.users.map((user, index) => (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <UserCard user={user} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Users;
