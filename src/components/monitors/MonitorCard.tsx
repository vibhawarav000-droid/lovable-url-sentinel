import React from 'react';
import { Monitor } from '@/types/monitor';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { UptimeBar } from './UptimeBar';
import { ResponseTimeChart } from './ResponseTimeChart';
import { Lock, Clock, AlertCircle, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

interface MonitorCardProps {
  monitor: Monitor;
  onClick?: () => void;
}

export const MonitorCard: React.FC<MonitorCardProps> = ({ monitor, onClick }) => {
  const getStatusIcon = () => {
    switch (monitor.status) {
      case 'up':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'down':
        return <XCircle className="h-4 w-4 text-destructive" />;
      case 'degraded':
        return <AlertTriangle className="h-4 w-4 text-warning" />;
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

  return (
    <div
      className={cn(
        'card-monitor cursor-pointer animate-fade-in',
        monitor.status === 'down' && 'border-destructive/50 bg-destructive/5'
      )}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {getStatusIcon()}
          <div>
            <h3 className="font-semibold text-foreground">{monitor.name}</h3>
            <p className="text-xs text-muted-foreground truncate max-w-[200px]">
              {monitor.url}
            </p>
          </div>
        </div>
        {getStatusBadge()}
      </div>

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
          <p className="text-xs text-muted-foreground mb-1">Avg Time</p>
          <p className="text-sm font-semibold">
            {formatResponseTime(monitor.avgResponseTime)}
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
