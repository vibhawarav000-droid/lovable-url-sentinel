import React from 'react';
import { Bell, Search, Calendar, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ThemeToggle } from '@/components/ThemeToggle';
import { UserProfileDropdown } from '@/components/layout/UserProfileDropdown';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  title: string;
  subtitle?: string;
  dateRange?: { from: Date; to: Date };
  onDateRangeChange?: (range: { from: Date; to: Date }) => void;
  showDatePicker?: boolean;
  actions?: React.ReactNode;
  onRefresh?: () => void;
  onSearch?: (value: string) => void;
  notificationCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  dateRange,
  onDateRangeChange,
  showDatePicker = false,
  actions,
  onRefresh,
  onSearch,
  notificationCount = 0,
}) => {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-30 bg-background border-b border-border">
      <div className="flex items-center justify-between h-16 px-6">
        <div>
          <h1 className="text-xl font-semibold">{title}</h1>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              className="w-64 pl-9"
              onChange={(e) => onSearch?.(e.target.value)}
            />
          </div>

          {/* Date Range Picker */}
          {showDatePicker && dateRange && onDateRangeChange && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Calendar className="h-4 w-4" />
                  <span className="hidden sm:inline">
                    {format(dateRange.from, 'MMM d, yyyy')} - {format(dateRange.to, 'MMM d, yyyy')}
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <CalendarComponent
                  mode="range"
                  selected={{ from: dateRange.from, to: dateRange.to }}
                  onSelect={(range) => {
                    if (range?.from && range?.to) {
                      onDateRangeChange({ from: range.from, to: range.to });
                    }
                  }}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          )}

          {/* Refresh */}
          <Button variant="ghost" size="icon" onClick={() => onRefresh?.()}>
            <RefreshCw className="h-4 w-4" />
          </Button>

          {/* Notifications */}
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            onClick={() => navigate('/alerts')}
          >
            <Bell className="h-5 w-5" />
            {notificationCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 h-5 min-w-[20px] px-1 text-xs"
              >
                {notificationCount}
              </Badge>
            )}
          </Button>

          {actions}
          <ThemeToggle />
          <UserProfileDropdown />
        </div>
      </div>
    </header>
  );
};
