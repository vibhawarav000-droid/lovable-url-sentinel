import React, { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { apiService } from '@/services/apiService';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Bell, BellOff, AlertTriangle, XCircle, Clock, Shield, Trash2, CheckCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { Alert } from '@/types/monitor';
import { useAuth } from '@/contexts/AuthContext';

const Alerts: React.FC = () => {
  const { hasPermission } = useAuth();
  const [alerts, setAlerts] = useState<any[]>([]);
  const [selectedAlerts, setSelectedAlerts] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const canManageAlerts = hasPermission(['super_admin', 'admin']);

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    try {
      const data = await apiService.getAlerts();
      setAlerts(data);
    } catch (err) {
      console.error('Failed to load alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  const unreadCount = alerts.filter(a => !a.read && !a.is_read).length;

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'down': return <XCircle className="h-5 w-5 text-destructive" />;
      case 'degraded':
      case 'response_time': return <AlertTriangle className="h-5 w-5 text-warning" />;
      case 'ssl_expiry': return <Shield className="h-5 w-5 text-primary" />;
      default: return <Bell className="h-5 w-5" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical': return <Badge variant="destructive">Critical</Badge>;
      case 'warning': return <Badge className="bg-warning text-warning-foreground">Warning</Badge>;
      case 'info': return <Badge variant="secondary">Info</Badge>;
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await apiService.markAlertRead(id);
      setAlerts(prev => prev.map(a => a.id === id ? { ...a, read: true, is_read: true } : a));
    } catch (err) {
      console.error('Failed to mark alert as read:', err);
    }
  };

  const handleMarkAllAsRead = () => {
    alerts.forEach(a => { if (!a.read && !a.is_read) handleMarkAsRead(a.id); });
  };

  const handleToggleSelect = (id: string) => {
    setSelectedAlerts(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleDeleteSelected = () => {
    setAlerts(prev => prev.filter(a => !selectedAlerts.includes(a.id)));
    setSelectedAlerts([]);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header title="Alerts" subtitle="Monitor notifications and alerts" />
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1"><Bell className="h-3 w-3" />{unreadCount} unread</Badge>
          </div>
          {canManageAlerts && (
            <div className="flex items-center gap-2">
              {selectedAlerts.length > 0 && (
                <Button variant="destructive" size="sm" onClick={handleDeleteSelected}>
                  <Trash2 className="h-4 w-4 mr-2" />Delete ({selectedAlerts.length})
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={handleMarkAllAsRead}>
                <CheckCheck className="h-4 w-4 mr-2" />Mark all as read
              </Button>
            </div>
          )}
        </div>

        {alerts.length === 0 ? (
          <Card className="p-16 flex flex-col items-center justify-center text-muted-foreground">
            <BellOff className="h-12 w-12 mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No alerts</h3>
            <p className="text-sm">You're all caught up!</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {alerts.map((alert) => {
              const isRead = alert.read || alert.is_read;
              return (
                <Card
                  key={alert.id}
                  className={cn(
                    'p-4 transition-all hover:shadow-md animate-fade-in cursor-pointer',
                    !isRead && 'bg-primary/5 border-primary/20',
                    selectedAlerts.includes(alert.id) && 'ring-2 ring-primary'
                  )}
                  onClick={() => handleMarkAsRead(alert.id)}
                >
                  <div className="flex items-start gap-4">
                    {canManageAlerts && (
                      <Checkbox
                        checked={selectedAlerts.includes(alert.id)}
                        onCheckedChange={() => handleToggleSelect(alert.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="mt-1"
                      />
                    )}
                    <div className="flex-shrink-0 mt-0.5">{getAlertIcon(alert.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h4 className={cn('font-medium', !isRead && 'text-foreground', isRead && 'text-muted-foreground')}>
                            {alert.monitorName || alert.monitor_name}
                          </h4>
                          <p className="text-sm text-muted-foreground">{alert.message}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {getSeverityBadge(alert.severity)}
                          {!isRead && <div className="w-2 h-2 rounded-full bg-primary animate-pulse-glow" />}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(alert.createdAt || alert.created_at), { addSuffix: true })}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Alerts;
