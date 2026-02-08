import React from 'react';
import { ResponseDataPoint } from '@/types/monitor';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useTheme } from '@/contexts/ThemeContext';

interface ResponseTimeChartProps {
  data: ResponseDataPoint[];
  height?: number;
  showAxis?: boolean;
}

export const ResponseTimeChart: React.FC<ResponseTimeChartProps> = ({ 
  data, 
  height = 80,
  showAxis = false 
}) => {
  const { theme } = useTheme();

  // Get last 48 hours of data for display
  const displayData = data.slice(-48).map((point, index) => ({
    ...point,
    index,
    time: new Date(point.timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    }),
  }));

  const chartColors = {
    stroke: theme === 'dark' ? 'hsl(160, 84%, 45%)' : 'hsl(160, 84%, 39%)',
    fill: theme === 'dark' ? 'hsl(160, 84%, 45%)' : 'hsl(160, 84%, 39%)',
    grid: theme === 'dark' ? 'hsl(217, 33%, 25%)' : 'hsl(214, 32%, 91%)',
    text: theme === 'dark' ? 'hsl(215, 20%, 65%)' : 'hsl(215, 16%, 47%)',
    tooltipBg: theme === 'dark' ? 'hsl(222, 47%, 8%)' : 'hsl(0, 0%, 100%)',
    tooltipBorder: theme === 'dark' ? 'hsl(217, 33%, 20%)' : 'hsl(214, 32%, 91%)',
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={displayData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
        <defs>
          <linearGradient id="responseGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={chartColors.fill} stopOpacity={0.3} />
            <stop offset="95%" stopColor={chartColors.fill} stopOpacity={0} />
          </linearGradient>
        </defs>
        {showAxis && (
          <>
            <XAxis 
              dataKey="time" 
              stroke={chartColors.text}
              fontSize={10}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              stroke={chartColors.text}
              fontSize={10}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${value}ms`}
            />
          </>
        )}
        <Tooltip
          contentStyle={{
            backgroundColor: chartColors.tooltipBg,
            border: `1px solid ${chartColors.tooltipBorder}`,
            borderRadius: '8px',
            fontSize: '12px',
          }}
          labelStyle={{ color: chartColors.text }}
          formatter={(value: number) => [`${value} ms`, 'Response Time']}
          labelFormatter={(label) => `Time: ${label}`}
        />
        <Area
          type="monotone"
          dataKey="responseTime"
          stroke={chartColors.stroke}
          strokeWidth={1.5}
          fill="url(#responseGradient)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};
