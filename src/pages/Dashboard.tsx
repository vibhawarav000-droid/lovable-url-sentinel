import React, { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { StatCard } from '@/components/dashboard/StatCard';
import { MonitorCard } from '@/components/monitors/MonitorCard';
import { mockMonitors, getDashboardStats } from '@/data/mockData';
import { Monitor, Activity, AlertTriangle, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ResponseTimeChart } from '@/components/monitors/ResponseTimeChart';

const Dashboard: React.FC = () => {
  const stats = getDashboardStats();
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    to: new Date(),
  });
  const [filter, setFilter] = useState<'all' | 'production' | 'uat'>('all');

  const filteredMonitors = mockMonitors.filter(monitor => {
    if (filter === 'all') return true;
    if (filter === 'production') return monitor.tags.includes('production');
    if (filter === 'uat') return monitor.tags.includes('uat');
    return true;
  });

  // Aggregate response time data for overview chart
  const aggregateResponseData = mockMonitors
    .filter(m => m.status !== 'down')
    .slice(0, 5)
    .flatMap(m => m.responseHistory.slice(-24));

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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Monitors"
            value={stats.totalMonitors}
            icon={Monitor}
          />
          <StatCard
            title="Monitors Up"
            value={stats.monitorsUp}
            icon={CheckCircle}
            variant="success"
          />
          <StatCard
            title="Monitors Down"
            value={stats.monitorsDown}
            icon={XCircle}
            variant={stats.monitorsDown > 0 ? 'danger' : 'default'}
          />
          <StatCard
            title="Avg Response Time"
            value={`${stats.avgResponseTime} ms`}
            icon={Clock}
          />
        </div>

        {/* Active Incidents Alert */}
        {stats.activeIncidents > 0 && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 flex items-center gap-4 animate-fade-in">
            <div className="p-3 bg-destructive/20 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-destructive animate-pulse-glow" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-destructive">
                {stats.activeIncidents} Active Incident{stats.activeIncidents > 1 ? 's' : ''}
              </h3>
              <p className="text-sm text-muted-foreground">
                Some services are experiencing issues. Click to view details.
              </p>
            </div>
            <Button variant="destructive" size="sm">
              View Incidents
            </Button>
          </div>
        )}

        {/* Response Time Overview */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Response Time Overview</h2>
            <div className="text-sm text-muted-foreground">
              Avg: <span className="text-foreground font-medium">{stats.avgResponseTime} ms</span>
            </div>
          </div>
          <ResponseTimeChart 
            data={aggregateResponseData} 
            height={200} 
            showAxis 
          />
        </div>

        {/* Monitor Filters */}
        <div className="flex items-center justify-between">
          <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="production">Production</TabsTrigger>
              <TabsTrigger value="uat">UAT</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button variant="default" className="gap-2">
            <Activity className="h-4 w-4" />
            Add Monitor
          </Button>
        </div>

        {/* Monitors Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredMonitors.map((monitor) => (
            <MonitorCard key={monitor.id} monitor={monitor} />
          ))}
        </div>

        {/* Recent Incidents Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4">Response Time</h3>
            <p className="text-sm text-muted-foreground">Waiting for response data...</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4">Recent Incidents</h3>
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <AlertTriangle className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">No incidents in specific time period</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
