import React from 'react';
import { Header } from '@/components/layout/Header';
import { mockStatusPages, mockMonitors } from '@/data/mockData';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { 
  Globe, 
  Lock, 
  ExternalLink, 
  Settings, 
  Plus,
  Monitor,
  Pencil,
  Copy,
} from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';

const StatusPages: React.FC = () => {
  const { hasPermission } = useAuth();
  const canManage = hasPermission(['super_admin', 'admin']);

  return (
    <div className="min-h-screen">
      <Header title="Status Pages" subtitle="Manage public and private status pages" />

      <div className="p-6 space-y-6">
        {/* Actions */}
        {canManage && (
          <div className="flex justify-end">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Create Status Page
            </Button>
          </div>
        )}

        {/* Status Pages Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {mockStatusPages.map((page) => {
            const pageMonitors = mockMonitors.filter(m => page.monitors.includes(m.id));
            const upCount = pageMonitors.filter(m => m.status === 'up').length;
            const isAllUp = upCount === pageMonitors.length;

            return (
              <Card key={page.id} className="p-6 transition-all hover:shadow-md animate-fade-in">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {page.isPublic ? (
                      <div className="p-2 bg-success/10 rounded-lg">
                        <Globe className="h-5 w-5 text-success" />
                      </div>
                    ) : (
                      <div className="p-2 bg-muted rounded-lg">
                        <Lock className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold">{page.name}</h3>
                      <p className="text-sm text-muted-foreground">/{page.slug}</p>
                    </div>
                  </div>
                  <Badge variant={isAllUp ? 'default' : 'destructive'}>
                    {isAllUp ? 'All Systems Operational' : 'Issues Detected'}
                  </Badge>
                </div>

                {/* Domain */}
                {page.domain && (
                  <div className="flex items-center gap-2 mb-4 p-3 bg-muted/50 rounded-lg">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{page.domain}</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6 ml-auto">
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                )}

                {/* Monitors Preview */}
                <div className="mb-4">
                  <p className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
                    <Monitor className="h-4 w-4" />
                    {pageMonitors.length} monitors • {upCount} up
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {pageMonitors.slice(0, 4).map((monitor) => (
                      <Badge key={monitor.id} variant="outline" className="text-xs">
                        <span className={`w-2 h-2 rounded-full mr-2 ${
                          monitor.status === 'up' ? 'bg-success' : 
                          monitor.status === 'down' ? 'bg-destructive' : 'bg-warning'
                        }`} />
                        {monitor.name}
                      </Badge>
                    ))}
                    {pageMonitors.length > 4 && (
                      <Badge variant="secondary" className="text-xs">
                        +{pageMonitors.length - 4} more
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Meta */}
                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <div className="text-xs text-muted-foreground">
                    Updated {format(new Date(page.updatedAt), 'MMM d, yyyy')}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" className="gap-2">
                      <ExternalLink className="h-4 w-4" />
                      Preview
                    </Button>
                    {canManage && (
                      <Button variant="ghost" size="sm" className="gap-2">
                        <Pencil className="h-4 w-4" />
                        Edit
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Empty State */}
        {mockStatusPages.length === 0 && (
          <Card className="p-16 flex flex-col items-center justify-center text-muted-foreground">
            <Globe className="h-12 w-12 mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No status pages</h3>
            <p className="text-sm mb-4">Create your first status page to share uptime with your users</p>
            {canManage && (
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Status Page
              </Button>
            )}
          </Card>
        )}
      </div>
    </div>
  );
};

export default StatusPages;
