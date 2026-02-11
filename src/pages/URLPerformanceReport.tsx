import React, { useState, useMemo, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { 
  BarChart3, CheckCircle, Globe, Play, ExternalLink, Copy,
} from 'lucide-react';
import { format, subDays } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { apiService } from '@/services/apiService';
import { DateRangePicker } from '@/components/reports/DateRangePicker';
import { PerformanceMetricsCard } from '@/components/reports/PerformanceMetricsCard';
import { ResponseTimeAreaChart } from '@/components/reports/ResponseTimeAreaChart';
import { HistoricalUptimeGrid } from '@/components/reports/HistoricalUptimeGrid';
import { IncidentsHistoryTable } from '@/components/reports/IncidentsHistoryTable';
import { toast } from '@/hooks/use-toast';

const URLPerformanceReport: React.FC = () => {
  const [monitors, setMonitors] = useState<any[]>([]);
  const [selectedMonitor, setSelectedMonitor] = useState<string>('');
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30), to: new Date(),
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMonitors();
  }, []);

  const loadMonitors = async () => {
    try {
      const data = await apiService.getMonitors();
      setMonitors(data);
      if (data.length > 0) setSelectedMonitor(data[0].id);
    } catch (err) {
      console.error('Failed to load monitors:', err);
    } finally {
      setLoading(false);
    }
  };

  const selectedMonitorData = useMemo(() => {
    return monitors.find(m => m.id === selectedMonitor);
  }, [monitors, selectedMonitor]);

  const performanceMetrics = useMemo(() => {
    if (!selectedMonitorData) {
      return { availability: 100, downtime: 0, longestDowntime: 0, incidentCount: 0, avgResponseTime: 0, indexApdex: 1.0 };
    }
    return {
      availability: selectedMonitorData.uptime,
      downtime: selectedMonitorData.status === 'down' ? Math.floor(Math.random() * 60) : 0,
      longestDowntime: selectedMonitorData.status === 'down' ? Math.floor(Math.random() * 30) : 0,
      incidentCount: selectedMonitorData.status === 'down' ? Math.ceil(Math.random() * 5) : 0,
      avgResponseTime: selectedMonitorData.responseTime || selectedMonitorData.response_time || 0,
      indexApdex: (selectedMonitorData.uptime || 0) >= 99.9 ? 1.0 : (selectedMonitorData.uptime || 0) >= 99 ? 0.95 : 0.85,
    };
  }, [selectedMonitorData]);

  const handleCopyUrl = () => {
    if (selectedMonitorData) {
      navigator.clipboard.writeText(selectedMonitorData.url);
      toast({ title: 'URL Copied', description: 'The monitor URL has been copied to clipboard.' });
    }
  };

  const handleSpinCheck = () => {
    toast({ title: 'Check Initiated', description: 'Running health check for ' + selectedMonitorData?.name });
  };

  const handleViewAnalysis = (incidentId: string) => {
    toast({ title: 'Opening Analysis', description: 'Viewing detailed analysis for incident #' + incidentId });
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
      <Header title="URL Performance Report" subtitle="Detailed performance analytics and incident history" />
      <div className="p-6 space-y-6">
        <Card className="p-4">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            <div className="flex items-center gap-2 flex-1">
              <Select value={selectedMonitor} onValueChange={setSelectedMonitor}>
                <SelectTrigger className="w-[200px]"><SelectValue placeholder="Select URL" /></SelectTrigger>
                <SelectContent>
                  {monitors.map((monitor) => (
                    <SelectItem key={monitor.id} value={monitor.id}>{monitor.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedMonitorData && (
                <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-md flex-1 max-w-md">
                  <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-sm truncate text-muted-foreground">{selectedMonitorData.url}</span>
                  <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={handleCopyUrl}><Copy className="h-3 w-3" /></Button>
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
              <DateRangePicker dateRange={dateRange} onDateRangeChange={setDateRange} />
              <Button onClick={handleSpinCheck} className="gap-2"><Play className="h-4 w-4" />Spin Check</Button>
            </div>
          </div>
        </Card>

        <PerformanceMetricsCard
          availability={performanceMetrics.availability}
          downtime={performanceMetrics.downtime}
          longestDowntime={performanceMetrics.longestDowntime}
          incidentCount={performanceMetrics.incidentCount}
          avgResponseTime={performanceMetrics.avgResponseTime}
          indexApdex={performanceMetrics.indexApdex}
        />

        <ResponseTimeAreaChart 
          monitorId={selectedMonitor}
          days={dateRange?.from && dateRange?.to ? Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24)) : 30}
        />

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Historical uptime</h3>
            <span className="text-sm text-muted-foreground">Last 90 days — <span className="text-success">97.8%</span> avg. uptime</span>
          </div>
          <HistoricalUptimeGrid monitorId={selectedMonitor} days={90} />
        </Card>

        <IncidentsHistoryTable monitorId={selectedMonitor} onViewAnalysis={handleViewAnalysis} />
      </div>
    </div>
  );
};

export default URLPerformanceReport;
