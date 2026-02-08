import React, { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { mockIncidents } from '@/data/mockData';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  XCircle,
  ChevronRight,
  User,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow } from 'date-fns';
import { Incident, IncidentStatus } from '@/types/monitor';
import { useAuth } from '@/contexts/AuthContext';

const Incidents: React.FC = () => {
  const { hasPermission } = useAuth();
  const [statusFilter, setStatusFilter] = useState<IncidentStatus | 'all'>('all');

  const canManageIncidents = hasPermission(['super_admin', 'admin']);

  const filteredIncidents = mockIncidents.filter(incident => 
    statusFilter === 'all' || incident.status === statusFilter
  );

  const getStatusIcon = (status: IncidentStatus) => {
    switch (status) {
      case 'ongoing':
        return <XCircle className="h-5 w-5 text-destructive" />;
      case 'acknowledged':
        return <AlertTriangle className="h-5 w-5 text-warning" />;
      case 'resolved':
        return <CheckCircle className="h-5 w-5 text-success" />;
    }
  };

  const getStatusBadge = (status: IncidentStatus) => {
    switch (status) {
      case 'ongoing':
        return <Badge className="status-badge-down">Ongoing</Badge>;
      case 'acknowledged':
        return <Badge className="status-badge-degraded">Acknowledged</Badge>;
      case 'resolved':
        return <Badge className="status-badge-up">Resolved</Badge>;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <Badge variant="destructive">Critical</Badge>;
      case 'major':
        return <Badge className="bg-warning text-warning-foreground">Major</Badge>;
      case 'minor':
        return <Badge variant="secondary">Minor</Badge>;
      default:
        return <Badge variant="outline">{severity}</Badge>;
    }
  };

  const IncidentCard: React.FC<{ incident: Incident }> = ({ incident }) => (
    <Card className={cn(
      'p-5 transition-all hover:shadow-md animate-fade-in',
      incident.status === 'ongoing' && 'border-destructive/50 bg-destructive/5'
    )}>
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 mt-1">
          {getStatusIcon(incident.status)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4 mb-2">
            <div>
              <h3 className="font-semibold text-foreground">{incident.title}</h3>
              <p className="text-sm text-muted-foreground">{incident.monitorName}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {getSeverityBadge(incident.severity)}
              {getStatusBadge(incident.status)}
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-3">{incident.description}</p>
          
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Started {formatDistanceToNow(new Date(incident.startedAt), { addSuffix: true })}
            </span>
            {incident.acknowledgedBy && (
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" />
                Acknowledged by {incident.acknowledgedBy}
              </span>
            )}
            {incident.duration && (
              <span>Duration: {incident.duration} min</span>
            )}
          </div>

          {/* Timeline */}
          <div className="mt-4 pt-4 border-t border-border">
            <div className="space-y-3">
              {incident.timeline.slice(0, 3).map((entry) => (
                <div key={entry.id} className="flex items-start gap-3">
                  <div className="w-2 h-2 mt-1.5 rounded-full bg-primary flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm">{entry.message}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(entry.timestamp), 'MMM d, h:mm a')}
                      {entry.user && ` · ${entry.user}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {canManageIncidents && incident.status !== 'resolved' && (
            <div className="mt-4 flex gap-2">
              {incident.status === 'ongoing' && (
                <Button size="sm" variant="outline">
                  Acknowledge
                </Button>
              )}
              <Button size="sm" variant="default">
                Resolve
              </Button>
              <Button size="sm" variant="ghost">
                View Details
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );

  return (
    <div className="min-h-screen">
      <Header title="Incidents" subtitle="Track and manage service incidents" />

      <div className="p-6 space-y-6">
        <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
          <TabsList>
            <TabsTrigger value="all">
              All ({mockIncidents.length})
            </TabsTrigger>
            <TabsTrigger value="ongoing">
              Ongoing ({mockIncidents.filter(i => i.status === 'ongoing').length})
            </TabsTrigger>
            <TabsTrigger value="acknowledged">
              Acknowledged ({mockIncidents.filter(i => i.status === 'acknowledged').length})
            </TabsTrigger>
            <TabsTrigger value="resolved">
              Resolved ({mockIncidents.filter(i => i.status === 'resolved').length})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {filteredIncidents.length === 0 ? (
          <Card className="p-16 flex flex-col items-center justify-center text-muted-foreground">
            <CheckCircle className="h-12 w-12 mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No incidents</h3>
            <p className="text-sm">All systems are operating normally</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredIncidents.map((incident) => (
              <IncidentCard key={incident.id} incident={incident} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Incidents;
