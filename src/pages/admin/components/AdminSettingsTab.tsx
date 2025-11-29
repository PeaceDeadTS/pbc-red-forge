import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Settings, Globe, Shield, Bell, Palette, Database, 
  Mail, Lock, Eye, Save, RotateCcw
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

export const AdminSettingsTab = () => {
  const { t } = useTranslation();
  const { toast } = useToast();

  // Placeholder settings state
  const [settings, setSettings] = useState({
    siteName: 'PBC RED',
    siteDescription: 'AI Model Platform',
    maintenanceMode: false,
    registrationEnabled: true,
    emailVerificationRequired: false,
    defaultUserGroup: 'user',
    maxUploadSize: '100',
    allowedFileTypes: '.safetensors, .ckpt, .pt',
    moderationEnabled: true,
    autoApproveContent: false,
    notifyAdminOnReport: true,
    notifyAdminOnNewUser: false,
  });

  const handleSave = () => {
    // Placeholder - will connect to API later
    toast({
      title: t('admin.settings.saved'),
      description: t('admin.settings.savedDesc'),
    });
  };

  const handleReset = () => {
    toast({
      title: t('admin.settings.reset'),
      description: t('admin.settings.resetDesc'),
    });
  };

  return (
    <div className="space-y-6">
      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            {t('admin.settings.general')}
          </CardTitle>
          <CardDescription>{t('admin.settings.generalDesc')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="siteName">{t('admin.settings.siteName')}</Label>
              <Input
                id="siteName"
                value={settings.siteName}
                onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="siteDescription">{t('admin.settings.siteDescription')}</Label>
              <Input
                id="siteDescription"
                value={settings.siteDescription}
                onChange={(e) => setSettings({ ...settings, siteDescription: e.target.value })}
              />
            </div>
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>{t('admin.settings.maintenanceMode')}</Label>
              <p className="text-sm text-muted-foreground">
                {t('admin.settings.maintenanceModeDesc')}
              </p>
            </div>
            <Switch
              checked={settings.maintenanceMode}
              onCheckedChange={(checked) => setSettings({ ...settings, maintenanceMode: checked })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Registration & Auth Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            {t('admin.settings.auth')}
          </CardTitle>
          <CardDescription>{t('admin.settings.authDesc')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>{t('admin.settings.registrationEnabled')}</Label>
              <p className="text-sm text-muted-foreground">
                {t('admin.settings.registrationEnabledDesc')}
              </p>
            </div>
            <Switch
              checked={settings.registrationEnabled}
              onCheckedChange={(checked) => setSettings({ ...settings, registrationEnabled: checked })}
            />
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>{t('admin.settings.emailVerification')}</Label>
              <p className="text-sm text-muted-foreground">
                {t('admin.settings.emailVerificationDesc')}
              </p>
            </div>
            <Switch
              checked={settings.emailVerificationRequired}
              onCheckedChange={(checked) => setSettings({ ...settings, emailVerificationRequired: checked })}
            />
          </div>
          
          <Separator />
          
          <div className="space-y-2">
            <Label>{t('admin.settings.defaultGroup')}</Label>
            <Select 
              value={settings.defaultUserGroup} 
              onValueChange={(value) => setSettings({ ...settings, defaultUserGroup: value })}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">{t('users.groups.user')}</SelectItem>
                <SelectItem value="creator">{t('users.groups.creator')}</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              {t('admin.settings.defaultGroupDesc')}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Content Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            {t('admin.settings.content')}
          </CardTitle>
          <CardDescription>{t('admin.settings.contentDesc')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="maxUploadSize">{t('admin.settings.maxUploadSize')}</Label>
              <div className="flex gap-2">
                <Input
                  id="maxUploadSize"
                  type="number"
                  value={settings.maxUploadSize}
                  onChange={(e) => setSettings({ ...settings, maxUploadSize: e.target.value })}
                  className="w-24"
                />
                <span className="flex items-center text-muted-foreground">MB</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="allowedFileTypes">{t('admin.settings.allowedFileTypes')}</Label>
              <Input
                id="allowedFileTypes"
                value={settings.allowedFileTypes}
                onChange={(e) => setSettings({ ...settings, allowedFileTypes: e.target.value })}
              />
            </div>
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>{t('admin.settings.moderationEnabled')}</Label>
              <p className="text-sm text-muted-foreground">
                {t('admin.settings.moderationEnabledDesc')}
              </p>
            </div>
            <Switch
              checked={settings.moderationEnabled}
              onCheckedChange={(checked) => setSettings({ ...settings, moderationEnabled: checked })}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>{t('admin.settings.autoApprove')}</Label>
              <p className="text-sm text-muted-foreground">
                {t('admin.settings.autoApproveDesc')}
              </p>
            </div>
            <Switch
              checked={settings.autoApproveContent}
              onCheckedChange={(checked) => setSettings({ ...settings, autoApproveContent: checked })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            {t('admin.settings.notifications')}
          </CardTitle>
          <CardDescription>{t('admin.settings.notificationsDesc')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>{t('admin.settings.notifyOnReport')}</Label>
              <p className="text-sm text-muted-foreground">
                {t('admin.settings.notifyOnReportDesc')}
              </p>
            </div>
            <Switch
              checked={settings.notifyAdminOnReport}
              onCheckedChange={(checked) => setSettings({ ...settings, notifyAdminOnReport: checked })}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>{t('admin.settings.notifyOnNewUser')}</Label>
              <p className="text-sm text-muted-foreground">
                {t('admin.settings.notifyOnNewUserDesc')}
              </p>
            </div>
            <Switch
              checked={settings.notifyAdminOnNewUser}
              onCheckedChange={(checked) => setSettings({ ...settings, notifyAdminOnNewUser: checked })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={handleReset}>
          <RotateCcw className="mr-2 h-4 w-4" />
          {t('admin.settings.resetToDefault')}
        </Button>
        <Button onClick={handleSave}>
          <Save className="mr-2 h-4 w-4" />
          {t('admin.settings.saveChanges')}
        </Button>
      </div>
    </div>
  );
};
