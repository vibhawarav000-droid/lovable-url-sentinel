import React, { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { StatCard } from '@/components/dashboard/StatCard';
import { MonitorCard } from '@/components/monitors/MonitorCard';
import { AddMonitorDialog } from '@/components/monitors/AddMonitorDialog';
import { apiService } from '@/services/apiService';
import { Monitor, Activity, AlertTriangle, Clock, CheckCircle, XCircle, Pause, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ResponseTimeChart } from '@/components/monitors/ResponseTimeChart';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { Environment } from '@/types/monitor';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    to: new Date(),
  });
  const [filter, setFilter] = useState<'all' | Environment>('all');
  const [monitors, setMonitors] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({
    totalMonitors: 0, monitorsUp: 0, monitorsDown: 0, monitorsDegraded: 0,
    monitorsPaused: 0, monitorsMaintenance: 0, avgResponseTime: 0, overallUptime: 0, activeIncidents: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [monitorsData, statsData] = await Promise.all([
        apiService.getMonitors(),
        apiService.getDashboardStats(),
      ]);
      setMonitors(monitorsData);
      setStats(statsData);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredMonitors = monitors.filter(monitor => {
    if (filter === 'all') return true;
    return monitor.environment === filter;
  });

  const aggregateResponseData = monitors
    .filter(m => m.status !== 'down')
    .slice(0, 5)
    .flatMap(m => (m.responseHistory || []).slice(-24));

  const handlePauseMonitor = async (monitor: any) => {
    try {
      await apiService.pauseMonitor(monitor.id);
      setMonitors(prev => prev.map(m => 
        m.id === monitor.id ? { ...m, status: 'paused', isPaused: true } : m
      ));
      toast({ title: 'Monitor Paused', description: `${monitor.name} has been paused.` });
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to pause monitor', variant: 'destructive' });
    }
  };

  const handleResumeMonitor = async (monitor: any) => {
    try {
      await apiService.resumeMonitor(monitor.id);
      setMonitors(prev => prev.map(m => 
        m.id === monitor.id ? { ...m, status: 'up', isPaused: false } : m
      ));
      toast({ title: 'Monitor Resumed', description: `${monitor.name} is now active.` });
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to resume monitor', variant: 'destructive' });
    }
  };

  const handleDeleteMonitor = async (monitor: any) => {
    if (window.confirm(`Are you sure you want to delete ${monitor.name}?`)) {
      try {
        await apiService.deleteMonitor(monitor.id);
        setMonitors(prev => prev.filter(m => m.id !== monitor.id));
        toast({ title: 'Monitor Deleted', description: `${monitor.name} has been deleted.`, variant: 'destructive' });
      } catch (err) {
        toast({ title: 'Error', description: 'Failed to delete monitor', variant: 'destructive' });
      }
    }
  };

  const handleEditMonitor = (monitor: any) => {
    toast({ title: 'Edit Monitor', description: `Opening edit form for ${monitor.name}` });
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
      <Header
        title="Dashboard"
        subtitle="Monitor your services in real-time"
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        showDatePicker
      />

      <div className="p-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
          <StatCard title="Total Monitors" value={stats.totalMonitors} icon={Monitor} />
          <StatCard title="Monitors Up" value={stats.monitorsUp} icon={CheckCircle} variant="success" />
          <StatCard title="Monitors Down" value={stats.monitorsDown} icon={XCircle} variant={stats.monitorsDown > 0 ? 'danger' : 'default'} />
          <StatCard title="Degraded" value={stats.monitorsDegraded} icon={AlertTriangle} variant={stats.monitorsDegraded > 0 ? 'warning' : 'default'} />
          <StatCard title="Paused" value={stats.monitorsPaused} icon={Pause} />
          <StatCard title="Maintenance" value={stats.monitorsMaintenance} icon={Wrench} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <StatCard title="Avg Response Time" value={`${stats.avgResponseTime} ms`} icon={Clock} />
          <StatCard title="Overall Uptime" value={`${stats.overallUptime}%`} icon={Activity} variant="success" />
        </div>

        {stats.activeIncidents > 0 && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 flex items-center gap-4 animate-fade-in">
            <div className="p-3 bg-destructive/20 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-destructive animate-pulse-glow" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-destructive">
                {stats.activeIncidents} Active Incident{stats.activeIncidents > 1 ? 's' : ''}
              </h3>
              <p className="text-sm text-muted-foreground">Some services are experiencing issues. Click to view details.</p>
            </div>
            <Button variant="destructive" size="sm" onClick={() => navigate('/incidents')}>View Incidents</Button>
          </div>
        )}

        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Response Time Overview</h2>
            <div className="text-sm text-muted-foreground">
              Avg: <span className="text-foreground font-medium">{stats.avgResponseTime} ms</span>
            </div>
          </div>
          <ResponseTimeChart data={aggregateResponseData} height={200} showAxis />
        </div>

        <div className="flex items-center justify-between flex-wrap gap-4">
          <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
            <TabsList>
              <TabsTrigger value="all">All ({monitors.length})</TabsTrigger>
              <TabsTrigger value="production">Production ({monitors.filter(m => m.environment === 'production').length})</TabsTrigger>
              <TabsTrigger value="uat">UAT ({monitors.filter(m => m.environment === 'uat').length})</TabsTrigger>
              <TabsTrigger value="pre-prod">Pre-Prod ({monitors.filter(m => m.environment === 'pre-prod').length})</TabsTrigger>
              <TabsTrigger value="internal">Internal ({monitors.filter(m => m.environment === 'internal').length})</TabsTrigger>
            </TabsList>
          </Tabs>
          <AddMonitorDialog />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredMonitors.map((monitor) => (
            <MonitorCard 
              key={monitor.id} 
              monitor={monitor}
              onEdit={handleEditMonitor}
              onPause={handlePauseMonitor}
              onResume={handleResumeMonitor}
              onDelete={handleDeleteMonitor}
            />
          ))}
        </div>

        {filteredMonitors.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Monitor className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No monitors found for this environment.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
