import React, { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { apiService } from '@/services/apiService';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { 
  Search, Download, Filter, Calendar, User, Activity, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';

const AuditLogs: React.FC = () => {
  const { hasPermission } = useAuth();
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const itemsPerPage = 10;

  useEffect(() => {
    loadLogs();
  }, []);

  if (!hasPermission(['super_admin', 'admin'])) {
    return <Navigate to="/dashboard" replace />;
  }

  const loadLogs = async () => {
    try {
      const data = await apiService.getAuditLogs(100, 0);
      setLogs(data);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log =>
    (log.userName || log.user_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (log.action || '').toLowerCase().includes(search.toLowerCase()) ||
    (log.details || '').toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getActionBadge = (action: string) => {
    const type = action.split('.')[1] || action;
    switch (type) {
      case 'create': return <Badge className="bg-success/10 text-success border-success/20">Create</Badge>;
      case 'update': return <Badge className="bg-primary/10 text-primary border-primary/20">Update</Badge>;
      case 'delete': return <Badge variant="destructive">Delete</Badge>;
      case 'invite': return <Badge className="bg-warning/10 text-warning border-warning/20">Invite</Badge>;
      case 'acknowledge': return <Badge variant="secondary">Acknowledge</Badge>;
      default: return <Badge variant="outline">{type}</Badge>;
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
      <Header title="Audit Logs" subtitle="Track all activities and changes" />
      <div className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search logs..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-muted/50" />
            </div>
            <Button variant="outline" size="icon"><Filter className="h-4 w-4" /></Button>
            <Button variant="outline" size="icon"><Calendar className="h-4 w-4" /></Button>
          </div>
          <Button variant="outline" className="gap-2"><Download className="h-4 w-4" />Export Logs</Button>
        </div>

        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Resource</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead>Timestamp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedLogs.map((log) => (
                <TableRow key={log.id} className="animate-fade-in">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{log.userName || log.user_name}</p>
                        <p className="text-xs text-muted-foreground">{log.userEmail || log.user_email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      {getActionBadge(log.action)}
                      <span className="text-xs text-muted-foreground">{log.action}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{log.resource}</span>
                    </div>
                  </TableCell>
                  <TableCell><p className="text-sm max-w-[200px] truncate">{log.details}</p></TableCell>
                  <TableCell><span className="text-sm font-mono text-muted-foreground">{log.ipAddress || log.ip_address}</span></TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(log.timestamp || log.created_at), 'MMM d, yyyy h:mm a')}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredLogs.length)} of {filteredLogs.length} entries
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm px-2">Page {currentPage} of {totalPages || 1}</span>
            <Button variant="outline" size="icon" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditLogs;
