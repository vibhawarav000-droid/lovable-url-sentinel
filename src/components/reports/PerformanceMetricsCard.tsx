import React from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface MetricProps {
  label: string;
  value: string | number;
  subValue?: string;
  className?: string;
  valueClassName?: string;
}

export const PerformanceMetric: React.FC<MetricProps> = ({
  label,
  value,
  subValue,
  className,
  valueClassName,
}) => {
  return (
    <div className={cn('text-center', className)}>
      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
        {label}
      </p>
      <p className={cn('text-2xl font-bold', valueClassName)}>{value}</p>
      {subValue && (
        <p className="text-xs text-muted-foreground mt-1">{subValue}</p>
      )}
    </div>
  );
};

interface PerformanceMetricsCardProps {
  availability: number;
  downtime: number;
  longestDowntime: number;
  incidentCount: number;
  avgResponseTime: number;
  indexApdex: number;
}

export const PerformanceMetricsCard: React.FC<PerformanceMetricsCardProps> = ({
  availability,
  downtime,
  longestDowntime,
  incidentCount,
  avgResponseTime,
  indexApdex,
}) => {
  return (
    <Card className="p-6">
      <h3 className="text-sm font-medium text-muted-foreground mb-4">
        Performance metrics
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <PerformanceMetric
          label="Availability"
          value={`${availability.toFixed(0)} %`}
          valueClassName={availability >= 99 ? 'text-success' : 'text-warning'}
        />
        <PerformanceMetric
          label="Downtime"
          value={downtime > 0 ? `${downtime} Minutes` : '0 Minutes'}
        />
        <PerformanceMetric
          label="Longest downtime duration"
          value={longestDowntime > 0 ? `${longestDowntime} mins` : '0 mins'}
        />
        <PerformanceMetric
          label="Incidents"
          value={incidentCount}
        />
      </div>
      
      <div className="mt-6 pt-6 border-t flex justify-end gap-8">
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Apdex</p>
          <p className="text-lg font-semibold">{indexApdex.toFixed(2)}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Avg. response time</p>
          <p className="text-lg font-semibold">{avgResponseTime} ms</p>
        </div>
      </div>
    </Card>
  );
};
