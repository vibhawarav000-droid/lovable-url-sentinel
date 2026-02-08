import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Card } from '@/components/ui/card';
import { subDays, format } from 'date-fns';

interface ResponseTimeAreaChartProps {
  monitorId: string;
  days?: number;
}

// Generate mock response time data
const generateResponseTimeData = (days: number) => {
  const data = [];
  const now = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const date = subDays(now, i);
    data.push({
      date: format(date, 'MMM dd'),
      responseTime: 150 + Math.random() * 300,
      uptime: 95 + Math.random() * 5,
      downtime: Math.random() > 0.9 ? Math.random() * 10 : 0,
    });
  }
  
  return data;
};

export const ResponseTimeAreaChart: React.FC<ResponseTimeAreaChartProps> = ({
  monitorId,
  days = 30,
}) => {
  const data = React.useMemo(() => generateResponseTimeData(days), [days]);

  const maxResponseTime = Math.max(...data.map(d => d.responseTime));
  const minResponseTime = Math.min(...data.map(d => d.responseTime));
  const avgResponseTime = data.reduce((acc, d) => acc + d.responseTime, 0) / data.length;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-4 text-sm">
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-primary" />
              Response time
            </span>
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-success" />
              Uptime
            </span>
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-destructive" />
              Downtime
            </span>
          </div>
        </div>
        <div className="flex gap-6 text-sm">
          <div>
            <span className="text-muted-foreground">Max: </span>
            <span className="font-medium">{maxResponseTime.toFixed(0)} ms</span>
          </div>
          <div>
            <span className="text-muted-foreground">Min: </span>
            <span className="font-medium">{minResponseTime.toFixed(0)} ms</span>
          </div>
          <div>
            <span className="text-muted-foreground">Avg: </span>
            <span className="font-medium">{avgResponseTime.toFixed(0)} ms</span>
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={250}>
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorResponse" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 11 }} 
            className="text-muted-foreground"
            tickLine={false}
          />
          <YAxis 
            tick={{ fontSize: 11 }} 
            className="text-muted-foreground"
            tickLine={false}
            axisLine={false}
            domain={[0, 'auto']}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '6px',
            }}
            labelStyle={{ color: 'hsl(var(--foreground))' }}
          />
          <Area
            type="monotone"
            dataKey="responseTime"
            stroke="hsl(var(--primary))"
            fillOpacity={1}
            fill="url(#colorResponse)"
            name="Response Time (ms)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  );
};
