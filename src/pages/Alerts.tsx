import React, { useState, useEffect, useCallback } from 'react';
import { Header } from '@/components/layout/Header';
import { apiService } from '@/services/apiService';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { 
  Bell, BellOff, AlertTriangle, XCircle, Clock, Shield, Trash2, CheckCheck, CalendarIcon, X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow, format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';

const Alerts: React.FC = () => {
  const { hasPermission } = useAuth();
  const [alerts, setAlerts] = useState<any[]>([]);
  const [selectedAlerts, setSelectedAlerts] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [accountFilter, setAccountFilter] = useState('');
  const [monitorFilter, setMonitorFilter] = useState('');
  const [accounts, setAccounts] = useState<string[]>([]);
  const [monitors, setMonitors] = useState<{ id: string; name: string }[]>([]);

  const canManageAlerts = hasPermission(['super_admin', 'admin']);

  useEffect(() => {
    loadFilters();
  }, []);

  useEffect(() => {
    loadAlerts();
  }, [search, dateRange, accountFilter, monitorFilter]);

  const loadFilters = async () => {
    try {
      const data = await apiService.getAlertFilters();
      setAccounts(data.accounts || []);
      setMonitors(data.monitors || []);
    } catch (err) {
      console.error('Failed to load filters:', err);
    }
  };

  const loadAlerts = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (search) params.search = search;
      if (dateRange.from && dateRange.to) {
        params.startDate = dateRange.from.toISOString();
        params.endDate = dateRange.to.toISOString();
      }
      if (accountFilter) params.account = accountFilter;
      if (monitorFilter) params.monitorId = monitorFilter;

      const data = await apiService.getAlerts(params);
      setAlerts(data);
    } catch (err) {
      console.error('Failed to load alerts:', err);
    } finally {
      setLoading(false);
    }
  }, [search, dateRange, accountFilter, monitorFilter]);

  const unreadCount = alerts.filter(a => !a.read).length;

  const clearFilters = () => {
    setDateRange({});
    setAccountFilter('');
    setMonitorFilter('');
    setSearch('');
  };

  const hasActiveFilters = !!dateRange.from || !!accountFilter || !!monitorFilter;

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
      setAlerts(prev => prev.map(a => a.id === id ? { ...a, read: true } : a));
    } catch (err) {
      console.error('Failed to mark alert as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await apiService.markAllAlertsRead();
      setAlerts(prev => prev.map(a => ({ ...a, read: true })));
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedAlerts(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleSelectAll = () => {
    if (selectedAlerts.length === alerts.length) {
      setSelectedAlerts([]);
    } else {
      setSelectedAlerts(alerts.map(a => a.id));
    }
  };

  const handleDeleteSelected = () => {
    setAlerts(prev => prev.filter(a => !selectedAlerts.includes(a.id)));
    setSelectedAlerts([]);
  };

  if (loading && alerts.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header
        title="Alerts"
        subtitle="Monitor notifications and alerts"
        onSearch={setSearch}
        onRefresh={loadAlerts}
        notificationCount={unreadCount}
      />
      <div className="p-6 space-y-6">
        {/* Filters Row */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Date Filter */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <CalendarIcon className="h-4 w-4" />
                {dateRange.from && dateRange.to
                  ? `${format(dateRange.from, 'MMM d')} - ${format(dateRange.to, 'MMM d')}`
                  : 'Date Range'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-popover" align="start">
              <Calendar
                mode="range"
                selected={dateRange.from && dateRange.to ? { from: dateRange.from, to: dateRange.to } : undefined}
                onSelect={(range) => {
                  if (range?.from && range?.to) {
                    setDateRange({ from: range.from, to: range.to });
                  }
                }}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>

          {/* Account Dropdown */}
          <Select value={accountFilter} onValueChange={setAccountFilter}>
            <SelectTrigger className="w-[180px] h-9">
              <SelectValue placeholder="All Accounts" />
            </SelectTrigger>
            <SelectContent className="bg-popover">
              <SelectItem value="all">All Accounts</SelectItem>
              {accounts.map(acc => (
                <SelectItem key={acc} value={acc}>{acc}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Monitor/URL Dropdown */}
          <Select value={monitorFilter} onValueChange={setMonitorFilter}>
            <SelectTrigger className="w-[180px] h-9">
              <SelectValue placeholder="All URLs" />
            </SelectTrigger>
            <SelectContent className="bg-popover">
              <SelectItem value="all">All URLs</SelectItem>
              {monitors.map(m => (
                <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1 text-muted-foreground">
              <X className="h-3 w-3" /> Clear filters
            </Button>
          )}
        </div>

        {/* Actions Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {canManageAlerts && (
              <Checkbox
                checked={alerts.length > 0 && selectedAlerts.length === alerts.length}
                onCheckedChange={handleSelectAll}
              />
            )}
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
              const isRead = alert.read;
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
