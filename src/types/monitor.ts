export type MonitorStatus = 'up' | 'down' | 'degraded' | 'paused' | 'maintenance';
export type MonitorType = 'http' | 'https' | 'tcp' | 'ping' | 'dns';
export type IncidentStatus = 'ongoing' | 'resolved' | 'acknowledged';
export type IncidentSeverity = 'critical' | 'major' | 'minor';
export type Environment = 'production' | 'uat' | 'pre-prod' | 'internal';

export interface Monitor {
  id: string;
  name: string;
  url: string;
  type: MonitorType;
  status: MonitorStatus;
  uptime: number;
  uptimeToday: number;
  responseTime: number;
  avgResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  checkInterval: number;
  timeout: number;
  sslExpiry?: string;
  sslDaysRemaining?: number;
  lastChecked: string;
  lastDowntime?: string;
  createdAt: string;
  tags: string[];
  alertCount: number;
  responseHistory: ResponseDataPoint[];
  uptimeHistory: UptimeDataPoint[];
  // New fields
  environment: Environment;
  accountName: string;
  timezone: string;
  httpCode?: number;
  downtimeReason?: string;
  isPaused?: boolean;
  maintenanceId?: string;
  // Advanced scheduling
  expectedDowntime?: ScheduledWindow;
  expectedUptime?: ScheduledWindow;
}

export interface ScheduledWindow {
  enabled: boolean;
  startTime: string; // HH:mm format
  endTime: string;
  daysOfWeek: number[]; // 0-6 (Sun-Sat)
  timezone: string;
}

export interface ResponseDataPoint {
  timestamp: string;
  responseTime: number;
  status: MonitorStatus;
  httpCode?: number;
}

export interface UptimeDataPoint {
  date: string;
  status: MonitorStatus;
  uptime: number;
}

export interface Incident {
  id: string;
  monitorId: string;
  monitorName: string;
  status: IncidentStatus;
  severity: IncidentSeverity;
  title: string;
  description: string;
  startedAt: string;
  resolvedAt?: string;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
  duration?: number;
  affectedRegions: string[];
  timeline: IncidentTimelineEntry[];
}

export interface IncidentTimelineEntry {
  id: string;
  timestamp: string;
  type: 'detected' | 'acknowledged' | 'update' | 'resolved';
  message: string;
  user?: string;
}

export interface Alert {
  id: string;
  monitorId: string;
  monitorName: string;
  type: 'down' | 'ssl_expiry' | 'response_time' | 'degraded' | 'expected_down' | 'expected_up' | 'maintenance';
  severity: 'critical' | 'warning' | 'info';
  message: string;
  createdAt: string;
  read: boolean;
}

export interface StatusPage {
  id: string;
  name: string;
  slug: string;
  domain?: string;
  isPublic: boolean;
  monitors: string[];
  theme: 'light' | 'dark' | 'auto';
  logo?: string;
  headerText?: string;
  footerText?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  action: string;
  resource: string;
  resourceId: string;
  details: string;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  plan: 'free' | 'pro' | 'business' | 'enterprise';
  monitorsLimit: number;
  monitorsUsed: number;
  usersLimit: number;
  usersCount: number;
  createdAt: string;
}

export interface DashboardStats {
  totalMonitors: number;
  monitorsUp: number;
  monitorsDown: number;
  monitorsDegraded: number;
  monitorsPaused: number;
  monitorsMaintenance: number;
  avgResponseTime: number;
  totalIncidents: number;
  activeIncidents: number;
  overallUptime: number;
}

// Maintenance Types
export interface MaintenanceWindow {
  id: string;
  name: string;
  description?: string;
  accountName: string;
  monitorIds: string[];
  startTime: string;
  endTime: string;
  timezone: string;
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  isRecurring: boolean;
  recurrence?: RecurrencePattern;
}

export interface RecurrencePattern {
  frequency: 'daily' | 'weekly' | 'monthly';
  interval: number;
  daysOfWeek?: number[];
  endDate?: string;
}

// Report Types
export interface DowntimeEvent {
  id: string;
  monitorId: string;
  monitorName: string;
  accountName: string;
  environment: Environment;
  startTime: string;
  endTime?: string;
  duration: number; // in minutes
  httpCode?: number;
  reason?: string;
  notes?: string;
  type: 'incident' | 'maintenance';
  // For maintenance events
  plannedDowntime?: number;
  actualDowntime?: number;
  uptimeDuringMaintenance?: number;
}

export interface UptimeReport {
  monitorId: string;
  monitorName: string;
  accountName: string;
  environment: Environment;
  period: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  startDate: string;
  endDate: string;
  totalUptime: number;
  plannedDowntime: number;
  outageDowntime: number;
  totalDowntimeMinutes: number;
  remarks?: string;
  rcaOfOutage?: string;
}

// Add Monitor Form Types
export interface AddMonitorForm {
  name: string;
  url: string;
  checkInterval: number;
  environment: Environment;
  timezone: string;
  accountName: string;
  timeout?: number;
  // Advanced settings
  enableScheduledDowntime?: boolean;
  expectedDownStart?: string;
  expectedDownEnd?: string;
  enableScheduledUptime?: boolean;
  expectedUpStart?: string;
  expectedUpEnd?: string;
  scheduledDays?: number[];
}
