import React, { useState, useMemo, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { 
  BarChart3, Download, FileSpreadsheet, Calendar, Building2, Globe,
  CheckCircle, AlertTriangle, Wrench, Search,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, subDays, startOfWeek, endOfWeek } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { apiService } from '@/services/apiService';
import { Environment } from '@/types/monitor';
import { DateRangePicker } from '@/components/reports/DateRangePicker';

const Reports: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'downtime' | 'uptime'>('uptime');
  const [period, setPeriod] = useState<'weekly' | 'monthly' | 'quarterly' | 'yearly'>('weekly');
  const [accountFilter, setAccountFilter] = useState<string>('all');
  const [environmentFilter, setEnvironmentFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 7), to: new Date(),
  });
  const [uptimeReports, setUptimeReports] = useState<any[]>([]);
  const [downtimeEvents, setDowntimeEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const environments: Environment[] = ['production', 'uat', 'pre-prod', 'internal'];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [uptime, downtime] = await Promise.all([
        apiService.getUptimeReports({ period }),
        apiService.getDowntimeEvents(),
      ]);
      setUptimeReports(uptime);
      setDowntimeEvents(downtime);
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const accounts = [...new Set(uptimeReports.map(r => r.accountName || r.account_name))];

  const filteredReports = useMemo(() => {
    return uptimeReports.filter(report => {
      const accName = report.accountName || report.account_name;
      const monName = report.monitorName || report.monitor_name;
      if (accountFilter !== 'all' && accName !== accountFilter) return false;
      if (environmentFilter !== 'all' && report.environment !== environmentFilter) return false;
      if (searchQuery && !monName?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [uptimeReports, accountFilter, environmentFilter, searchQuery]);

  const filteredEvents = useMemo(() => {
    return downtimeEvents.filter(event => {
      const accName = event.accountName || event.account_name;
      const monName = event.monitorName || event.monitor_name;
      if (accountFilter !== 'all' && accName !== accountFilter) return false;
      if (environmentFilter !== 'all' && event.environment !== environmentFilter) return false;
      if (searchQuery && !monName?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [downtimeEvents, accountFilter, environmentFilter, searchQuery]);

  const getPeriodRange = () => {
    const now = new Date();
    switch (period) {
      case 'weekly': return `${format(startOfWeek(now), 'MMM d')} - ${format(endOfWeek(now), 'MMM d, yyyy')}`;
      case 'monthly': return format(now, 'MMMM yyyy');
      case 'quarterly': return `Q${Math.ceil((now.getMonth() + 1) / 3)} ${now.getFullYear()}`;
      case 'yearly': return now.getFullYear().toString();
    }
  };

  const handleExport = () => {
    const headers = ['Account Name', 'URL Name', 'Total Uptime', 'Planned Downtime', 'Outage Downtime', 'Total Downtime (Mins)', 'Remarks', 'RCA of Outage'];
    const rows = filteredReports.map(r => [
      r.accountName || r.account_name, r.monitorName || r.monitor_name,
      `${(r.totalUptime || r.total_uptime || 0).toFixed(2)}%`,
      `${r.plannedDowntime || r.planned_downtime || 0} min`,
      `${r.outageDowntime || r.outage_downtime || 0} min`,
      (r.totalDowntimeMinutes || r.total_downtime_minutes || 0).toFixed(0),
      r.remarks || 'N/A', r.rcaOfOutage || r.rca_of_outage || 'N/A',
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `uptime-report-${period}-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
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
      <Header title="Reports" subtitle="View and export uptime and downtime reports" />
      <div className="p-6 space-y-6">
        <Card className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-primary" />
                SAAS Accounts {period.charAt(0).toUpperCase() + period.slice(1)} & Quarterly Application Uptime Report
              </h2>
              <p className="text-sm text-muted-foreground mt-1">{getPeriodRange()}</p>
            </div>
            <Button onClick={handleExport} className="gap-2"><Download className="h-4 w-4" />Export Report</Button>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search by URL name..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
            </div>
            <div className="flex flex-wrap gap-2">
              <DateRangePicker dateRange={dateRange} onDateRangeChange={setDateRange} />
              <Select value={period} onValueChange={(v) => setPeriod(v as any)}>
                <SelectTrigger className="w-36"><Calendar className="h-4 w-4 mr-2" /><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem><SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem><SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
              <Select value={accountFilter} onValueChange={setAccountFilter}>
                <SelectTrigger className="w-44"><Building2 className="h-4 w-4 mr-2" /><SelectValue placeholder="Account" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Accounts</SelectItem>
                  {accounts.map(acc => <SelectItem key={acc} value={acc}>{acc}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={environmentFilter} onValueChange={setEnvironmentFilter}>
                <SelectTrigger className="w-40"><Globe className="h-4 w-4 mr-2" /><SelectValue placeholder="Environment" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Environments</SelectItem>
                  {environments.map(env => <SelectItem key={env} value={env}>{env.charAt(0).toUpperCase() + env.slice(1).replace('-', ' ')}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList>
            <TabsTrigger value="uptime" className="gap-2"><BarChart3 className="h-4 w-4" />Uptime Report</TabsTrigger>
            <TabsTrigger value="downtime" className="gap-2"><AlertTriangle className="h-4 w-4" />Downtime Events</TabsTrigger>
          </TabsList>

          <TabsContent value="uptime" className="mt-4">
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-primary/5">
                      <TableHead className="font-semibold">Account Name</TableHead>
                      <TableHead className="font-semibold">Total Uptime</TableHead>
                      <TableHead className="font-semibold">Planned Downtime</TableHead>
                      <TableHead className="font-semibold">Outage Downtime</TableHead>
                      <TableHead className="font-semibold">Total Downtime (Mins)</TableHead>
                      <TableHead className="font-semibold">Remarks</TableHead>
                      <TableHead className="font-semibold max-w-xs">RCA of Outage</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredReports.map((report, idx) => {
                      const uptime = report.totalUptime ?? report.total_uptime ?? 0;
                      return (
                        <TableRow key={idx} className="hover:bg-muted/50">
                          <TableCell><div><p className="font-medium">{report.accountName || report.account_name}</p><p className="text-xs text-muted-foreground">{report.monitorName || report.monitor_name}</p></div></TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {uptime >= 99.9 ? <CheckCircle className="h-4 w-4 text-success" /> : <AlertTriangle className="h-4 w-4 text-warning" />}
                              <span className={cn('font-medium', uptime >= 99.9 ? 'text-success' : uptime >= 99 ? 'text-foreground' : 'text-warning')}>{uptime.toFixed(2)}%</span>
                            </div>
                          </TableCell>
                          <TableCell>{report.plannedDowntime ?? report.planned_downtime ?? 0} min</TableCell>
                          <TableCell>{report.outageDowntime ?? report.outage_downtime ?? 0} min</TableCell>
                          <TableCell>{(report.totalDowntimeMinutes ?? report.total_downtime_minutes ?? 0).toFixed(0)} min</TableCell>
                          <TableCell><span className={cn(report.remarks === 'N/A' ? 'text-muted-foreground' : 'text-foreground')}>{report.remarks || 'N/A'}</span></TableCell>
                          <TableCell className="max-w-xs"><p className="text-sm text-muted-foreground line-clamp-3">{report.rcaOfOutage || report.rca_of_outage || 'N/A'}</p></TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="downtime" className="mt-4">
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-primary/5">
                      <TableHead className="font-semibold">URL / Account</TableHead>
                      <TableHead className="font-semibold">Date & Time</TableHead>
                      <TableHead className="font-semibold">HTTP Code</TableHead>
                      <TableHead className="font-semibold">Duration</TableHead>
                      <TableHead className="font-semibold">Type</TableHead>
                      <TableHead className="font-semibold">Reason</TableHead>
                      <TableHead className="font-semibold max-w-xs">Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEvents.map((event, idx) => (
                      <TableRow key={idx} className="hover:bg-muted/50">
                        <TableCell><div><p className="font-medium">{event.monitorName || event.monitor_name}</p><p className="text-xs text-muted-foreground">{event.accountName || event.account_name}</p></div></TableCell>
                        <TableCell><div><p className="text-sm">{format(new Date(event.startTime || event.start_time), 'MMM d, yyyy')}</p><p className="text-xs text-muted-foreground">{format(new Date(event.startTime || event.start_time), 'h:mm a')}</p></div></TableCell>
                        <TableCell>{(event.httpCode || event.http_code) ? <Badge variant={(event.httpCode || event.http_code) >= 500 ? 'destructive' : 'secondary'}>{event.httpCode || event.http_code}</Badge> : <span className="text-muted-foreground">-</span>}</TableCell>
                        <TableCell><span className={cn((event.duration || 0) > 60 ? 'text-destructive' : 'text-foreground')}>{(event.duration || 0) > 0 ? `${event.duration} min` : '0 min'}</span></TableCell>
                        <TableCell><Badge variant={(event.type || event.event_type) === 'incident' ? 'destructive' : 'secondary'} className="gap-1">{(event.type || event.event_type) === 'maintenance' && <Wrench className="h-3 w-3" />}{((event.type || event.event_type) || '').charAt(0).toUpperCase() + ((event.type || event.event_type) || '').slice(1)}</Badge></TableCell>
                        <TableCell><p className="text-sm max-w-[200px] truncate">{event.reason || '-'}</p></TableCell>
                        <TableCell className="max-w-xs"><p className="text-sm text-muted-foreground line-clamp-3">{event.notes || '-'}</p></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Reports;
