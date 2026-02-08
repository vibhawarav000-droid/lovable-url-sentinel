import React from 'react';
import { Monitor } from '@/types/monitor';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { UptimeBar } from './UptimeBar';
import { ResponseTimeChart } from './ResponseTimeChart';
import { MonitorActionsMenu } from './MonitorActionsMenu';
import { Lock, Clock, AlertCircle, CheckCircle, XCircle, AlertTriangle, Pause, Wrench } from 'lucide-react';

interface MonitorCardProps {
  monitor: Monitor;
  onClick?: () => void;
  onEdit?: (monitor: Monitor) => void;
  onPause?: (monitor: Monitor) => void;
  onResume?: (monitor: Monitor) => void;
  onDelete?: (monitor: Monitor) => void;
}

export const MonitorCard: React.FC<MonitorCardProps> = ({ 
  monitor, 
  onClick,
  onEdit,
  onPause,
  onResume,
  onDelete,
}) => {
  const getStatusIcon = () => {
    switch (monitor.status) {
      case 'up':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'down':
        return <XCircle className="h-4 w-4 text-destructive" />;
      case 'degraded':
        return <AlertTriangle className="h-4 w-4 text-warning" />;
      case 'paused':
        return <Pause className="h-4 w-4 text-muted-foreground" />;
      case 'maintenance':
        return <Wrench className="h-4 w-4 text-primary" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = () => {
    switch (monitor.status) {
      case 'up':
        return <Badge className="status-badge-up">Up</Badge>;
      case 'down':
        return <Badge className="status-badge-down">Down</Badge>;
      case 'degraded':
        return <Badge className="status-badge-degraded">Degraded</Badge>;
      case 'paused':
        return <Badge variant="secondary">Paused</Badge>;
      case 'maintenance':
        return <Badge className="bg-primary/20 text-primary border-primary/30">Maintenance</Badge>;
      default:
        return <Badge variant="secondary">Paused</Badge>;
    }
  };

  const formatResponseTime = (ms: number) => {
    if (ms === 0) return 'N/A';
    return `${ms} ms`;
  };

  const formatUptime = (uptime: number) => {
    return `${uptime.toFixed(2)}%`;
  };

  const getHttpCodeBadge = () => {
    if (!monitor.httpCode) return null;
    const code = monitor.httpCode;
    let variant = 'secondary';
    
    if (code >= 200 && code < 300) variant = 'success';
    else if (code >= 300 && code < 400) variant = 'warning';
    else if (code >= 400) variant = 'destructive';

    return (
      <Badge 
        variant="outline" 
        className={cn(
          'text-xs',
          code >= 200 && code < 300 && 'border-success/50 text-success',
          code >= 300 && code < 400 && 'border-warning/50 text-warning',
          code >= 400 && 'border-destructive/50 text-destructive'
        )}
      >
        {code}
      </Badge>
    );
  };

  return (
    <div
      className={cn(
        'card-monitor cursor-pointer animate-fade-in relative',
        monitor.status === 'down' && 'border-destructive/50 bg-destructive/5',
        monitor.status === 'maintenance' && 'border-primary/50 bg-primary/5'
      )}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {getStatusIcon()}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-foreground truncate">{monitor.name}</h3>
              {getHttpCodeBadge()}
            </div>
            <p className="text-xs text-muted-foreground truncate max-w-[200px]">
              {monitor.url}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge()}
          <MonitorActionsMenu 
            monitor={monitor}
            onEdit={onEdit}
            onPause={onPause}
            onResume={onResume}
            onDelete={onDelete}
          />
        </div>
      </div>

      {/* Downtime Reason */}
      {monitor.status === 'down' && monitor.downtimeReason && (
        <div className="mb-4 p-2 rounded-lg bg-destructive/10 border border-destructive/20">
          <p className="text-xs text-destructive flex items-center gap-2">
            <AlertCircle className="h-3 w-3 flex-shrink-0" />
            <span className="line-clamp-2">{monitor.downtimeReason}</span>
          </p>
        </div>
      )}

      {/* Maintenance Banner */}
      {monitor.status === 'maintenance' && (
        <div className="mb-4 p-2 rounded-lg bg-primary/10 border border-primary/20">
          <p className="text-xs text-primary flex items-center gap-2">
            <Wrench className="h-3 w-3 flex-shrink-0" />
            <span>Under scheduled maintenance</span>
          </p>
        </div>
      )}

      {/* Uptime Bar */}
      <div className="mb-4">
        <UptimeBar data={monitor.uptimeHistory} />
      </div>

      {/* Response Time Chart */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-muted-foreground">Response Time</span>
          <span className="text-xs text-muted-foreground">
            Avg: {formatResponseTime(monitor.avgResponseTime)} · Max: {formatResponseTime(monitor.maxResponseTime)}
          </span>
        </div>
        <ResponseTimeChart data={monitor.responseHistory} height={80} />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-4 pt-4 border-t border-border">
        <div>
          <p className="text-xs text-muted-foreground mb-1">Uptime</p>
          <p className={cn(
            'text-sm font-semibold',
            monitor.uptime >= 99.9 ? 'text-success' : 
            monitor.uptime >= 99 ? 'text-foreground' : 'text-destructive'
          )}>
            {formatUptime(monitor.uptime)}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Response</p>
          <p className="text-sm font-semibold">
            {formatResponseTime(monitor.responseTime)}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Env</p>
          <p className="text-sm font-semibold capitalize">
            {monitor.environment.replace('-', ' ')}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">SSL</p>
          <div className="flex items-center gap-1">
            <Lock className="h-3 w-3 text-success" />
            <p className="text-sm font-semibold">
              {monitor.sslDaysRemaining}d
            </p>
          </div>
        </div>
      </div>

      {/* Alert indicator */}
      {monitor.status === 'down' && (
        <div className="mt-4 pt-4 border-t border-destructive/20 flex items-center gap-2 text-destructive">
          <AlertCircle className="h-4 w-4 animate-pulse-glow" />
          <span className="text-sm font-medium">Service Unavailable</span>
        </div>
      )}
    </div>
  );
};
