import React from 'react';
import { MonitorStatus } from '@/types/monitor';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface UptimeBarProps {
  data: { date: string; status: MonitorStatus; uptime: number }[];
  className?: string;
}

export const UptimeBar: React.FC<UptimeBarProps> = ({ data, className }) => {
  // Get last 90 days or available data
  const displayData = data.slice(-90);

  return (
    <div className={cn('flex gap-0.5 h-6', className)}>
      {displayData.map((point, index) => (
        <Tooltip key={index}>
          <TooltipTrigger asChild>
            <div
              className={cn(
                'uptime-bar flex-1 min-w-[2px] max-w-[4px] cursor-pointer hover:opacity-80',
                point.status === 'up' && 'uptime-bar-up',
                point.status === 'down' && 'uptime-bar-down',
                point.status === 'degraded' && 'uptime-bar-degraded'
              )}
            />
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">
            <p className="font-medium">{new Date(point.date).toLocaleDateString()}</p>
            <p className="capitalize">{point.status} - {point.uptime}%</p>
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
};
