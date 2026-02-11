import React, { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { apiService } from '@/services/apiService';
import { MonitorCard } from '@/components/monitors/MonitorCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, Search, Filter, Grid3X3, List, CheckCircle, XCircle, AlertTriangle,
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

const Monitors: React.FC = () => {
  const { hasPermission } = useAuth();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [monitors, setMonitors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const canManageMonitors = hasPermission(['super_admin', 'admin']);

  useEffect(() => {
    loadMonitors();
  }, []);

  const loadMonitors = async () => {
    try {
      const data = await apiService.getMonitors();
      setMonitors(data);
    } catch (err) {
      console.error('Failed to load monitors:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredMonitors = monitors.filter(monitor => {
    const matchesSearch = monitor.name.toLowerCase().includes(search.toLowerCase()) ||
      monitor.url.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || monitor.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusCounts = {
    all: monitors.length,
    up: monitors.filter(m => m.status === 'up').length,
    down: monitors.filter(m => m.status === 'down').length,
    degraded: monitors.filter(m => m.status === 'degraded').length,
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
      <Header title="Monitors" subtitle="Manage and view all your monitors" />

      <div className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search monitors..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-muted/50" />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon"><Filter className="h-4 w-4" /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setStatusFilter('all')}>All ({statusCounts.all})</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('up')}><CheckCircle className="h-4 w-4 mr-2 text-success" />Up ({statusCounts.up})</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('down')}><XCircle className="h-4 w-4 mr-2 text-destructive" />Down ({statusCounts.down})</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('degraded')}><AlertTriangle className="h-4 w-4 mr-2 text-warning" />Degraded ({statusCounts.degraded})</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center border border-border rounded-lg p-1">
              <Button variant={viewMode === 'grid' ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8" onClick={() => setViewMode('grid')}><Grid3X3 className="h-4 w-4" /></Button>
              <Button variant={viewMode === 'list' ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8" onClick={() => setViewMode('list')}><List className="h-4 w-4" /></Button>
            </div>
            {canManageMonitors && (
              <Button className="gap-2"><Plus className="h-4 w-4" />Add Monitor</Button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {Object.entries(statusCounts).map(([status, count]) => (
            <Badge key={status} variant={statusFilter === status ? 'default' : 'outline'} className={cn('cursor-pointer transition-all', statusFilter === status && 'bg-primary text-primary-foreground')} onClick={() => setStatusFilter(status)}>
              {status.charAt(0).toUpperCase() + status.slice(1)} ({count})
            </Badge>
          ))}
        </div>

        {filteredMonitors.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Search className="h-12 w-12 mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No monitors found</h3>
            <p className="text-sm">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className={cn(viewMode === 'grid' ? 'grid grid-cols-1 lg:grid-cols-2 gap-6' : 'space-y-4')}>
            {filteredMonitors.map((monitor) => (
              <MonitorCard key={monitor.id} monitor={monitor} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Monitors;
