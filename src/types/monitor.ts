export type MonitorStatus = 'up' | 'down' | 'degraded' | 'paused';
export type MonitorType = 'http' | 'https' | 'tcp' | 'ping' | 'dns';
export type IncidentStatus = 'ongoing' | 'resolved' | 'acknowledged';
export type IncidentSeverity = 'critical' | 'major' | 'minor';

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
}

export interface ResponseDataPoint {
  timestamp: string;
  responseTime: number;
  status: MonitorStatus;
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
  type: 'down' | 'ssl_expiry' | 'response_time' | 'degraded';
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
  avgResponseTime: number;
  totalIncidents: number;
  activeIncidents: number;
  overallUptime: number;
}
