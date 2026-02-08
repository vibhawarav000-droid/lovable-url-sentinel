import React from 'react';
import { format, subDays, startOfDay, differenceInDays } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface DayStatus {
  date: Date;
  status: 'up' | 'down' | 'partial' | 'maintenance';
  uptime: number;
  incidents?: number;
}

interface HistoricalUptimeGridProps {
  monitorId: string;
  days?: number;
}

// Generate mock historical data
const generateHistoricalData = (monitorId: string, days: number): DayStatus[] => {
  const data: DayStatus[] = [];
  const now = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const date = subDays(startOfDay(now), i);
    const random = Math.random();
    
    let status: 'up' | 'down' | 'partial' | 'maintenance';
    let uptime: number;
    let incidents: number | undefined;
    
    if (random > 0.95) {
      status = 'down';
      uptime = Math.random() * 50;
      incidents = Math.ceil(Math.random() * 3);
    } else if (random > 0.9) {
      status = 'partial';
      uptime = 90 + Math.random() * 9;
      incidents = 1;
    } else if (random > 0.85 && i % 14 === 0) {
      status = 'maintenance';
      uptime = 100;
    } else {
      status = 'up';
      uptime = 99.9 + Math.random() * 0.1;
    }
    
    data.push({ date, status, uptime, incidents });
  }
  
  return data;
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'up':
      return 'bg-success hover:bg-success/80';
    case 'down':
      return 'bg-destructive hover:bg-destructive/80';
    case 'partial':
      return 'bg-warning hover:bg-warning/80';
    case 'maintenance':
      return 'bg-muted hover:bg-muted/80';
    default:
      return 'bg-muted';
  }
};

export const HistoricalUptimeGrid: React.FC<HistoricalUptimeGridProps> = ({
  monitorId,
  days = 90,
}) => {
  const historicalData = React.useMemo(
    () => generateHistoricalData(monitorId, days),
    [monitorId, days]
  );

  // Group by month
  const months = React.useMemo(() => {
    const monthsMap = new Map<string, DayStatus[]>();
    historicalData.forEach((day) => {
      const monthKey = format(day.date, 'MMM yyyy');
      if (!monthsMap.has(monthKey)) {
        monthsMap.set(monthKey, []);
      }
      monthsMap.get(monthKey)!.push(day);
    });
    return Array.from(monthsMap.entries());
  }, [historicalData]);

  return (
    <TooltipProvider>
      <div className="space-y-4">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-success" />
            <span className="text-xs text-muted-foreground">Operational</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-warning" />
            <span className="text-xs text-muted-foreground">Partial</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-destructive" />
            <span className="text-xs text-muted-foreground">Downtime</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-muted" />
            <span className="text-xs text-muted-foreground">Maintenance</span>
          </div>
        </div>

        <div className="flex gap-8 overflow-x-auto pb-2">
          {months.map(([month, days]) => (
            <div key={month} className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">{month}</p>
              <div className="grid grid-cols-7 gap-1">
                {days.map((day, idx) => (
                  <Tooltip key={idx}>
                    <TooltipTrigger asChild>
                      <div
                        className={cn(
                          'w-4 h-4 rounded-sm cursor-pointer transition-colors',
                          getStatusColor(day.status)
                        )}
                      />
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="text-xs">
                        <p className="font-medium">{format(day.date, 'MMM d, yyyy')}</p>
                        <p>Uptime: {day.uptime.toFixed(2)}%</p>
                        {day.incidents && <p>Incidents: {day.incidents}</p>}
                        <p className="capitalize">Status: {day.status}</p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </TooltipProvider>
  );
};
