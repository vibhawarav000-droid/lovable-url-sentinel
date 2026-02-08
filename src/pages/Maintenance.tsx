import React, { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Wrench, 
  Plus, 
  Calendar, 
  Clock, 
  Building2,
  AlertCircle,
  CheckCircle,
  XCircle,
  Pencil,
  Trash2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { mockMonitors } from '@/data/mockData';
import { MaintenanceWindow } from '@/types/monitor';
import { toast } from '@/hooks/use-toast';

// Mock maintenance data
const mockMaintenanceWindows: MaintenanceWindow[] = [
  {
    id: 'maint-1',
    name: 'Scheduled Server Upgrade',
    description: 'Upgrading server infrastructure to improve performance',
    accountName: 'ABC Corp',
    monitorIds: ['1', '2', '3'],
    startTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    endTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000).toISOString(),
    timezone: 'UTC',
    status: 'scheduled',
    createdBy: 'John Super',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isRecurring: false,
  },
  {
    id: 'maint-2',
    name: 'Database Maintenance',
    description: 'Weekly database optimization and backup',
    accountName: 'DSpace Systems',
    monitorIds: ['5', '7', '8', '9'],
    startTime: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    endTime: new Date(Date.now() + 90 * 60 * 1000).toISOString(),
    timezone: 'America/New_York',
    status: 'active',
    createdBy: 'Jane Admin',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    isRecurring: true,
    recurrence: {
      frequency: 'weekly',
      interval: 1,
      daysOfWeek: [0],
    },
  },
  {
    id: 'maint-3',
    name: 'SSL Certificate Renewal',
    description: 'Renewing SSL certificates for all production endpoints',
    accountName: 'ABC Corp',
    monitorIds: ['1', '5', '10'],
    startTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    endTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
    timezone: 'UTC',
    status: 'completed',
    createdBy: 'John Super',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    isRecurring: false,
  },
];

const Maintenance: React.FC = () => {
  const { hasPermission } = useAuth();
  const canManage = hasPermission(['super_admin', 'admin']);
  const [windows, setWindows] = useState<MaintenanceWindow[]>(mockMaintenanceWindows);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'scheduled' | 'active' | 'completed'>('all');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    accountName: '',
    monitorIds: [] as string[],
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    timezone: 'UTC',
    isRecurring: false,
    recurrenceFrequency: 'weekly',
    recurrenceDays: [] as number[],
  });

  const filteredWindows = windows.filter(w => 
    filter === 'all' || w.status === filter
  );

  const getStatusBadge = (status: MaintenanceWindow['status']) => {
    switch (status) {
      case 'scheduled':
        return <Badge className="bg-primary/20 text-primary">Scheduled</Badge>;
      case 'active':
        return <Badge className="bg-warning/20 text-warning">Active</Badge>;
      case 'completed':
        return <Badge className="bg-success/20 text-success">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="secondary">Cancelled</Badge>;
    }
  };

  const getStatusIcon = (status: MaintenanceWindow['status']) => {
    switch (status) {
      case 'scheduled':
        return <Calendar className="h-5 w-5 text-primary" />;
      case 'active':
        return <Wrench className="h-5 w-5 text-warning animate-pulse" />;
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-success" />;
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const handleSubmit = () => {
    const newWindow: MaintenanceWindow = {
      id: `maint-${Date.now()}`,
      name: formData.name,
      description: formData.description,
      accountName: formData.accountName,
      monitorIds: formData.monitorIds,
      startTime: new Date(`${formData.startDate}T${formData.startTime}`).toISOString(),
      endTime: new Date(`${formData.endDate}T${formData.endTime}`).toISOString(),
      timezone: formData.timezone,
      status: 'scheduled',
      createdBy: 'Current User',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isRecurring: formData.isRecurring,
      recurrence: formData.isRecurring ? {
        frequency: formData.recurrenceFrequency as 'daily' | 'weekly' | 'monthly',
        interval: 1,
        daysOfWeek: formData.recurrenceDays,
      } : undefined,
    };

    setWindows([...windows, newWindow]);
    setDialogOpen(false);
    toast({
      title: 'Maintenance Scheduled',
      description: `${formData.name} has been scheduled successfully.`,
    });

    // Reset form
    setFormData({
      name: '',
      description: '',
      accountName: '',
      monitorIds: [],
      startDate: '',
      startTime: '',
      endDate: '',
      endTime: '',
      timezone: 'UTC',
      isRecurring: false,
      recurrenceFrequency: 'weekly',
      recurrenceDays: [],
    });
  };

  const handleCancel = (id: string) => {
    setWindows(windows.map(w => 
      w.id === id ? { ...w, status: 'cancelled' as const } : w
    ));
    toast({
      title: 'Maintenance Cancelled',
      description: 'The maintenance window has been cancelled.',
    });
  };

  return (
    <div className="min-h-screen">
      <Header title="Maintenance" subtitle="Schedule and manage maintenance windows" />

      <div className="p-6 space-y-6">
        {/* Header Actions */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              All ({windows.length})
            </Button>
            <Button
              variant={filter === 'scheduled' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('scheduled')}
            >
              Scheduled ({windows.filter(w => w.status === 'scheduled').length})
            </Button>
            <Button
              variant={filter === 'active' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('active')}
            >
              Active ({windows.filter(w => w.status === 'active').length})
            </Button>
            <Button
              variant={filter === 'completed' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('completed')}
            >
              Completed ({windows.filter(w => w.status === 'completed').length})
            </Button>
          </div>

          {canManage && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Schedule Maintenance
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Wrench className="h-5 w-5 text-primary" />
                    Schedule Maintenance Window
                  </DialogTitle>
                  <DialogDescription>
                    Schedule a maintenance window. URLs under maintenance won't affect uptime metrics.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Maintenance Name *</Label>
                    <Input
                      placeholder="Server Upgrade"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      placeholder="Describe the maintenance activity..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Account Name *
                    </Label>
                    <Input
                      placeholder="ACME Corp"
                      value={formData.accountName}
                      onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Affected URLs *</Label>
                    <div className="border rounded-lg p-3 max-h-40 overflow-y-auto space-y-2">
                      {mockMonitors.map((monitor) => (
                        <div key={monitor.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`monitor-${monitor.id}`}
                            checked={formData.monitorIds.includes(monitor.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setFormData({
                                  ...formData,
                                  monitorIds: [...formData.monitorIds, monitor.id],
                                });
                              } else {
                                setFormData({
                                  ...formData,
                                  monitorIds: formData.monitorIds.filter((id) => id !== monitor.id),
                                });
                              }
                            }}
                          />
                          <label htmlFor={`monitor-${monitor.id}`} className="text-sm cursor-pointer">
                            {monitor.name}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Start Date *</Label>
                      <Input
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Start Time *</Label>
                      <Input
                        type="time"
                        value={formData.startTime}
                        onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>End Date *</Label>
                      <Input
                        type="date"
                        value={formData.endDate}
                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>End Time *</Label>
                      <Input
                        type="time"
                        value={formData.endTime}
                        onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Timezone</Label>
                    <Select
                      value={formData.timezone}
                      onValueChange={(val) => setFormData({ ...formData, timezone: val })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UTC">UTC</SelectItem>
                        <SelectItem value="America/New_York">Eastern Time</SelectItem>
                        <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                        <SelectItem value="Europe/London">London</SelectItem>
                        <SelectItem value="Asia/Kolkata">India (IST)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSubmit} disabled={!formData.name || !formData.accountName || formData.monitorIds.length === 0}>
                    Schedule Maintenance
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Active Maintenance Alert */}
        {windows.some(w => w.status === 'active') && (
          <div className="bg-warning/10 border border-warning/20 rounded-xl p-4 flex items-center gap-4 animate-fade-in">
            <div className="p-3 bg-warning/20 rounded-lg">
              <Wrench className="h-6 w-6 text-warning animate-pulse" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-warning">Active Maintenance</h3>
              <p className="text-sm text-muted-foreground">
                {windows.filter(w => w.status === 'active').length} maintenance window(s) currently in progress
              </p>
            </div>
          </div>
        )}

        {/* Maintenance Windows List */}
        {filteredWindows.length === 0 ? (
          <Card className="p-16 flex flex-col items-center justify-center text-muted-foreground">
            <Wrench className="h-12 w-12 mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No Maintenance Windows</h3>
            <p className="text-sm">Schedule maintenance to prevent false alerts during planned downtime.</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredWindows.map((window) => (
              <Card
                key={window.id}
                className={cn(
                  'p-5 transition-all hover:shadow-md animate-fade-in',
                  window.status === 'active' && 'border-warning/50 bg-warning/5'
                )}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-1">
                    {getStatusIcon(window.status)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div>
                        <h3 className="font-semibold text-foreground">{window.name}</h3>
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                          <Building2 className="h-3 w-3" />
                          {window.accountName}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {window.isRecurring && (
                          <Badge variant="outline">Recurring</Badge>
                        )}
                        {getStatusBadge(window.status)}
                      </div>
                    </div>
                    
                    {window.description && (
                      <p className="text-sm text-muted-foreground mb-3">{window.description}</p>
                    )}

                    <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {format(new Date(window.startTime), 'MMM d, yyyy h:mm a')} - {format(new Date(window.endTime), 'h:mm a')}
                      </span>
                      <span>{window.timezone}</span>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {window.monitorIds.slice(0, 5).map((id) => {
                        const monitor = mockMonitors.find(m => m.id === id);
                        return monitor ? (
                          <Badge key={id} variant="secondary" className="text-xs">
                            {monitor.name}
                          </Badge>
                        ) : null;
                      })}
                      {window.monitorIds.length > 5 && (
                        <Badge variant="secondary" className="text-xs">
                          +{window.monitorIds.length - 5} more
                        </Badge>
                      )}
                    </div>

                    {canManage && window.status === 'scheduled' && (
                      <div className="mt-4 pt-4 border-t border-border flex gap-2">
                        <Button size="sm" variant="outline" className="gap-1">
                          <Pencil className="h-3 w-3" />
                          Edit
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="text-destructive hover:text-destructive gap-1"
                          onClick={() => handleCancel(window.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                          Cancel
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Maintenance;
