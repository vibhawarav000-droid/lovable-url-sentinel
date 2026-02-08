import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Monitor,
  AlertTriangle,
  Bell,
  FileText,
  Settings,
  Shield,
  Users,
  Building2,
  Activity,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
  requiredRole?: UserRole | UserRole[];
}

const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Monitors', href: '/monitors', icon: Monitor },
  { name: 'Incidents', href: '/incidents', icon: AlertTriangle, badge: 2 },
  { name: 'Alerts', href: '/alerts', icon: Bell, badge: 4 },
  { name: 'Status Pages', href: '/status-pages', icon: FileText },
  { name: 'Settings', href: '/settings', icon: Settings },
  { name: 'Audit Logs', href: '/audit-logs', icon: Shield, requiredRole: ['super_admin', 'admin'] },
  { name: 'User Management', href: '/users', icon: Users, requiredRole: ['super_admin', 'admin'] },
  { name: 'Org Management', href: '/organization', icon: Building2, requiredRole: 'super_admin' },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle }) => {
  const location = useLocation();
  const { user, logout, hasPermission } = useAuth();

  const filteredNavigation = navigation.filter(item => {
    if (!item.requiredRole) return true;
    return hasPermission(item.requiredRole);
  });

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-sidebar-border">
          {!collapsed && (
            <Link to="/dashboard" className="flex items-center gap-2">
              <Activity className="h-6 w-6 text-primary" />
              <span className="text-lg font-bold gradient-text">UptimeHost</span>
            </Link>
          )}
          {collapsed && (
            <Activity className="h-6 w-6 text-primary mx-auto" />
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className={cn('h-8 w-8', collapsed && 'absolute -right-4 bg-sidebar border border-sidebar-border rounded-full')}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto scrollbar-thin">
          {filteredNavigation.map((item) => {
            const isActive = location.pathname === item.href;
            
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  'sidebar-link',
                  isActive ? 'sidebar-link-active' : 'sidebar-link-inactive'
                )}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {!collapsed && (
                  <>
                    <span className="flex-1">{item.name}</span>
                    {item.badge && item.badge > 0 && (
                      <Badge variant="destructive" className="h-5 min-w-[20px] text-xs">
                        {item.badge}
                      </Badge>
                    )}
                  </>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-sidebar-border">
          {!collapsed && user && (
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-medium text-primary">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.name}</p>
                <p className="text-xs text-muted-foreground capitalize">
                  {user.role.replace('_', ' ')}
                </p>
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            size={collapsed ? 'icon' : 'default'}
            onClick={logout}
            className={cn('w-full justify-start gap-3 text-muted-foreground hover:text-destructive', collapsed && 'justify-center')}
          >
            <LogOut className="h-4 w-4" />
            {!collapsed && 'Logout'}
          </Button>
        </div>
      </div>
    </aside>
  );
};
