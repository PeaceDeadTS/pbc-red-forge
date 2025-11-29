import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { 
  Activity, Server, Database, HardDrive, Cpu, MemoryStick, 
  Clock, RefreshCw, AlertTriangle, CheckCircle, XCircle, Zap
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { api } from '@/lib/api';

interface HealthStatus {
  status: string;
  timestamp: string;
  uptime?: number;
  version?: string;
}

export const AdminSystemTab = () => {
  const { t } = useTranslation();

  // Fetch API health status
  const { data: healthData, isLoading: healthLoading, refetch: refetchHealth } = useQuery<HealthStatus>({
    queryKey: ['api-health'],
    queryFn: async () => {
      const response = await api.get('/health');
      return response.data;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Placeholder system stats - will be connected to real monitoring later
  const systemStats = {
    cpuUsage: 0,
    memoryUsage: 0,
    diskUsage: 0,
    activeConnections: 0,
    requestsPerMinute: 0,
  };

  const formatUptime = (seconds?: number) => {
    if (!seconds) return '-';
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  return (
    <div className="space-y-6">
      {/* Service Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Server className="h-4 w-4" />
              {t('admin.system.apiStatus')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {healthLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : healthData?.status === 'ok' ? (
                <CheckCircle className="h-5 w-5 text-green-400" />
              ) : (
                <XCircle className="h-5 w-5 text-red-400" />
              )}
              <span className="text-lg font-semibold">
                {healthLoading ? t('common.loading') : healthData?.status === 'ok' ? t('admin.system.online') : t('admin.system.offline')}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Database className="h-4 w-4" />
              {t('admin.system.databaseStatus')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {healthData?.status === 'ok' ? (
                <CheckCircle className="h-5 w-5 text-green-400" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-yellow-400" />
              )}
              <span className="text-lg font-semibold">
                {healthData?.status === 'ok' ? t('admin.system.connected') : t('admin.system.unknown')}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {t('admin.system.uptime')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">
              {formatUptime(healthData?.uptime)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Resources */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                {t('admin.system.resources')}
              </CardTitle>
              <CardDescription>{t('admin.system.resourcesDesc')}</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetchHealth()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              {t('admin.system.refresh')}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <Cpu className="h-4 w-4 text-muted-foreground" />
                {t('admin.system.cpu')}
              </span>
              <span className="text-muted-foreground">{systemStats.cpuUsage}%</span>
            </div>
            <Progress value={systemStats.cpuUsage} className="h-2" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <MemoryStick className="h-4 w-4 text-muted-foreground" />
                {t('admin.system.memory')}
              </span>
              <span className="text-muted-foreground">{systemStats.memoryUsage}%</span>
            </div>
            <Progress value={systemStats.memoryUsage} className="h-2" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <HardDrive className="h-4 w-4 text-muted-foreground" />
                {t('admin.system.disk')}
              </span>
              <span className="text-muted-foreground">{systemStats.diskUsage}%</span>
            </div>
            <Progress value={systemStats.diskUsage} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            {t('admin.system.performance')}
          </CardTitle>
          <CardDescription>{t('admin.system.performanceDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 rounded-lg bg-card/50 border">
              <div className="text-2xl font-bold">{systemStats.activeConnections}</div>
              <div className="text-sm text-muted-foreground">{t('admin.system.activeConnections')}</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-card/50 border">
              <div className="text-2xl font-bold">{systemStats.requestsPerMinute}</div>
              <div className="text-sm text-muted-foreground">{t('admin.system.requestsPerMin')}</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-card/50 border">
              <div className="text-2xl font-bold">{healthData?.version || '-'}</div>
              <div className="text-sm text-muted-foreground">{t('admin.system.apiVersion')}</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-card/50 border">
              <div className="text-2xl font-bold">
                {healthData?.timestamp ? new Date(healthData.timestamp).toLocaleTimeString() : '-'}
              </div>
              <div className="text-sm text-muted-foreground">{t('admin.system.lastCheck')}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Admin Actions */}
      <Card>
        <CardHeader>
          <CardTitle>{t('admin.system.actions')}</CardTitle>
          <CardDescription>{t('admin.system.actionsDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" disabled>
              <RefreshCw className="h-5 w-5" />
              <span>{t('admin.system.clearCache')}</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" disabled>
              <Database className="h-5 w-5" />
              <span>{t('admin.system.backupDb')}</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" disabled>
              <Activity className="h-5 w-5" />
              <span>{t('admin.system.viewLogs')}</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex flex-col gap-2 text-destructive hover:text-destructive" disabled>
              <AlertTriangle className="h-5 w-5" />
              <span>{t('admin.system.restartServices')}</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
