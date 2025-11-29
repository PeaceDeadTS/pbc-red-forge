import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Users, Shield, Crown, Palette, User as UserIcon, Search, 
  MoreHorizontal, Ban, CheckCircle, Trash2, Edit, Mail, Calendar
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
  DropdownMenuSeparator, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, 
  DialogHeader, DialogTitle
} from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { usersApi, adminApi } from '@/lib/api';
import { User, UserGroup, UsersListResponse } from '@/types/auth';
import { useAuth } from '@/contexts/AuthContext';

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

export const AdminUsersTab = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [groupsDialogOpen, setGroupsDialogOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<'active' | 'banned'>('active');

  // Fetch users
  const { data: usersData, isLoading: usersLoading } = useQuery<UsersListResponse>({
    queryKey: ['admin-users', searchQuery],
    queryFn: async () => {
      const response = await usersApi.getUsers({ limit: 100 });
      return response.data;
    },
  });

  // Fetch available groups
  const { data: groupsData } = useQuery<{ groups: UserGroup[] }>({
    queryKey: ['user-groups'],
    queryFn: async () => {
      const response = await usersApi.getGroups();
      return response.data;
    },
  });

  // Update user groups mutation
  const updateGroupsMutation = useMutation({
    mutationFn: async ({ userId, groups }: { userId: string; groups: string[] }) => {
      return usersApi.updateUserGroups(userId, groups);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast({
        title: t('admin.users.groupsUpdated'),
        description: t('admin.users.groupsUpdatedDesc'),
      });
      setGroupsDialogOpen(false);
      setSelectedUser(null);
    },
    onError: () => {
      toast({
        title: t('common.error'),
        description: t('admin.users.groupsUpdateError'),
        variant: 'destructive',
      });
    },
  });

  // Update user status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ userId, status }: { userId: string; status: string }) => {
      return adminApi.updateUserStatus(userId, status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast({
        title: t('admin.users.statusUpdated'),
        description: t('admin.users.statusUpdatedDesc'),
      });
      setStatusDialogOpen(false);
      setSelectedUser(null);
    },
    onError: () => {
      toast({
        title: t('common.error'),
        description: t('admin.users.statusUpdateError'),
        variant: 'destructive',
      });
    },
  });

  const handleEditGroups = (user: User) => {
    setSelectedUser(user);
    setSelectedGroup(user.groups?.[0] || null);
    setGroupsDialogOpen(true);
  };

  const handleToggleStatus = (user: User) => {
    setSelectedUser(user);
    setNewStatus(user.status === 'banned' ? 'active' : 'banned');
    setStatusDialogOpen(true);
  };

  const handleSaveGroups = () => {
    if (selectedUser && selectedGroup) {
      updateGroupsMutation.mutate({ userId: selectedUser.id, groups: [selectedGroup] });
    }
  };

  const handleSaveStatus = () => {
    if (selectedUser) {
      updateStatusMutation.mutate({ userId: selectedUser.id, status: newStatus });
    }
  };

  const filteredUsers = usersData?.users.filter(user => 
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.display_name?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
  };

  const getUserInitials = (user: User) => {
    return (user.display_name || user.username)
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('admin.users.totalUsers')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usersData?.pagination.total || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('admin.users.admins')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-400">
              {filteredUsers.filter(u => u.groups?.includes('administrator')).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('admin.users.creators')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-400">
              {filteredUsers.filter(u => u.groups?.includes('creator')).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('admin.users.banned')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-400">
              {filteredUsers.filter(u => u.status === 'banned').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                {t('admin.users.manageUsers')}
              </CardTitle>
              <CardDescription>{t('admin.users.manageUsersDesc')}</CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('admin.users.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {usersLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('admin.users.user')}</TableHead>
                    <TableHead>{t('admin.users.email')}</TableHead>
                    <TableHead>{t('admin.users.groups')}</TableHead>
                    <TableHead>{t('admin.users.status')}</TableHead>
                    <TableHead>{t('admin.users.registered')}</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user.avatar_url || undefined} />
                            <AvatarFallback className="bg-gradient-primary text-primary-foreground text-xs">
                              {getUserInitials(user)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{user.display_name || user.username}</div>
                            <div className="text-sm text-muted-foreground">@{user.username}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{user.email}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {user.groups?.map((group) => (
                            <Badge
                              key={group}
                              variant="outline"
                              className={`text-xs ${groupColors[group] || ''}`}
                            >
                              {groupIcons[group]}
                              <span className="ml-1">{t(`users.groups.${group}`, group)}</span>
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={user.status === 'banned' ? 'destructive' : 'outline'}
                          className={user.status !== 'banned' ? 'bg-green-500/20 text-green-400 border-green-500/30' : ''}
                        >
                          {user.status === 'banned' ? t('admin.users.statusBanned') : t('admin.users.statusActive')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(user.created_at)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleEditGroups(user)}
                              disabled={user.id === currentUser?.id}
                            >
                              <Shield className="mr-2 h-4 w-4" />
                              {t('admin.users.editGroups')}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleStatus(user)}>
                              {user.status === 'banned' ? (
                                <>
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  {t('admin.users.unban')}
                                </>
                              ) : (
                                <>
                                  <Ban className="mr-2 h-4 w-4" />
                                  {t('admin.users.ban')}
                                </>
                              )}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Groups Dialog */}
      <Dialog open={groupsDialogOpen} onOpenChange={setGroupsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('admin.users.editGroupsTitle')}</DialogTitle>
            <DialogDescription>
              {t('admin.users.editGroupsDesc', { user: selectedUser?.display_name || selectedUser?.username })}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <RadioGroup
              value={selectedGroup || ''}
              onValueChange={(value) => setSelectedGroup(value)}
            >
              {groupsData?.groups.map((group) => (
                <div key={group.name} className="flex items-center space-x-3">
                  <RadioGroupItem value={group.name} id={group.name} />
                  <Label htmlFor={group.name} className="flex items-center gap-2 cursor-pointer">
                    <Badge variant="outline" className={groupColors[group.name] || ''}>
                      {groupIcons[group.name]}
                      <span className="ml-1">{group.display_name}</span>
                    </Badge>
                    {group.description && (
                      <span className="text-sm text-muted-foreground">— {group.description}</span>
                    )}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGroupsDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleSaveGroups}
              disabled={updateGroupsMutation.isPending || !selectedGroup}
            >
              {t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Status Change Dialog */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {newStatus === 'banned' ? t('admin.users.banUserTitle') : t('admin.users.unbanUserTitle')}
            </DialogTitle>
            <DialogDescription>
              {newStatus === 'banned' 
                ? t('admin.users.banUserDesc', { user: selectedUser?.display_name || selectedUser?.username })
                : t('admin.users.unbanUserDesc', { user: selectedUser?.display_name || selectedUser?.username })
              }
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button 
              variant={newStatus === 'banned' ? 'destructive' : 'default'}
              onClick={handleSaveStatus} 
              disabled={updateStatusMutation.isPending}
            >
              {newStatus === 'banned' ? t('admin.users.ban') : t('admin.users.unban')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
