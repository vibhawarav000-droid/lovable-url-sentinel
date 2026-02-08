import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { 
  MoreVertical, 
  Pencil, 
  Pause, 
  Play, 
  Trash2, 
  BarChart3, 
  Wrench 
} from 'lucide-react';
import { Monitor } from '@/types/monitor';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

interface MonitorActionsMenuProps {
  monitor: Monitor;
  onEdit?: (monitor: Monitor) => void;
  onPause?: (monitor: Monitor) => void;
  onResume?: (monitor: Monitor) => void;
  onDelete?: (monitor: Monitor) => void;
  onScheduleMaintenance?: (monitor: Monitor) => void;
}

export const MonitorActionsMenu: React.FC<MonitorActionsMenuProps> = ({
  monitor,
  onEdit,
  onPause,
  onResume,
  onDelete,
  onScheduleMaintenance,
}) => {
  const { hasPermission } = useAuth();
  const navigate = useNavigate();
  const canManage = hasPermission(['super_admin', 'admin']);

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit) {
      onEdit(monitor);
    } else {
      toast({ title: 'Edit', description: `Editing ${monitor.name}` });
    }
  };

  const handlePause = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onPause) {
      onPause(monitor);
    } else {
      toast({ title: 'Paused', description: `${monitor.name} has been paused` });
    }
  };

  const handleResume = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onResume) {
      onResume(monitor);
    } else {
      toast({ title: 'Resumed', description: `${monitor.name} is now active` });
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(monitor);
    } else {
      toast({ 
        title: 'Delete', 
        description: `Are you sure you want to delete ${monitor.name}?`,
        variant: 'destructive' 
      });
    }
  };

  const handleViewReport = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/reports?monitor=${monitor.id}`);
  };

  const handleScheduleMaintenance = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onScheduleMaintenance) {
      onScheduleMaintenance(monitor);
    } else {
      navigate(`/maintenance?monitor=${monitor.id}`);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreVertical className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {canManage && (
          <>
            <DropdownMenuItem onClick={handleEdit} className="cursor-pointer">
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
            
            {monitor.status === 'paused' || monitor.isPaused ? (
              <DropdownMenuItem onClick={handleResume} className="cursor-pointer">
                <Play className="h-4 w-4 mr-2 text-success" />
                Resume
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={handlePause} className="cursor-pointer">
                <Pause className="h-4 w-4 mr-2 text-warning" />
                Pause
              </DropdownMenuItem>
            )}

            <DropdownMenuItem onClick={handleScheduleMaintenance} className="cursor-pointer">
              <Wrench className="h-4 w-4 mr-2 text-muted-foreground" />
              Schedule Maintenance
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
          </>
        )}

        <DropdownMenuItem onClick={handleViewReport} className="cursor-pointer">
          <BarChart3 className="h-4 w-4 mr-2" />
          View Report
        </DropdownMenuItem>

        {canManage && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={handleDelete} 
              className="cursor-pointer text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
