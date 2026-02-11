import React, { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { apiService } from '@/services/apiService';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  Globe, Lock, ExternalLink, Plus, Monitor, Pencil, Copy,
} from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';

const StatusPages: React.FC = () => {
  const { hasPermission } = useAuth();
  const canManage = hasPermission(['super_admin', 'admin']);
  const [statusPages, setStatusPages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const data = await apiService.getStatusPages();
      setStatusPages(data);
    } catch (err) {
      console.error('Failed to load status pages:', err);
    } finally {
      setLoading(false);
    }
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
      <Header title="Status Pages" subtitle="Manage public and private status pages" />
      <div className="p-6 space-y-6">
        {canManage && (
          <div className="flex justify-end">
            <Button className="gap-2"><Plus className="h-4 w-4" />Create Status Page</Button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {statusPages.map((page) => {
            const isPublic = page.isPublic ?? page.is_public;
            return (
              <Card key={page.id} className="p-6 transition-all hover:shadow-md animate-fade-in">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {isPublic ? (
                      <div className="p-2 bg-success/10 rounded-lg"><Globe className="h-5 w-5 text-success" /></div>
                    ) : (
                      <div className="p-2 bg-muted rounded-lg"><Lock className="h-5 w-5 text-muted-foreground" /></div>
                    )}
                    <div>
                      <h3 className="font-semibold">{page.name}</h3>
                      <p className="text-sm text-muted-foreground">/{page.slug}</p>
                    </div>
                  </div>
                </div>

                {page.domain && (
                  <div className="flex items-center gap-2 mb-4 p-3 bg-muted/50 rounded-lg">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{page.domain}</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6 ml-auto"><Copy className="h-3 w-3" /></Button>
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <div className="text-xs text-muted-foreground">
                    Updated {format(new Date(page.updatedAt || page.updated_at), 'MMM d, yyyy')}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" className="gap-2"><ExternalLink className="h-4 w-4" />Preview</Button>
                    {canManage && <Button variant="ghost" size="sm" className="gap-2"><Pencil className="h-4 w-4" />Edit</Button>}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {statusPages.length === 0 && (
          <Card className="p-16 flex flex-col items-center justify-center text-muted-foreground">
            <Globe className="h-12 w-12 mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No status pages</h3>
            <p className="text-sm mb-4">Create your first status page to share uptime with your users</p>
            {canManage && <Button><Plus className="h-4 w-4 mr-2" />Create Status Page</Button>}
          </Card>
        )}
      </div>
    </div>
  );
};

export default StatusPages;
