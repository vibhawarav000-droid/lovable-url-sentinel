const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class ApiService {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('uptimehost_token');
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('uptimehost_token', token);
    } else {
      localStorage.removeItem('uptimehost_token');
    }
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Auth
  async login(email: string, password: string) {
    const data = await this.request<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(data.token);
    return data;
  }

  logout() {
    this.setToken(null);
  }

  async getMe() {
    return this.request<{ user: any }>('/auth/me');
  }

  // Monitors
  async getMonitors(params?: { environment?: string; account_name?: string; status?: string; search?: string }) {
    const query = params ? '?' + new URLSearchParams(Object.entries(params).filter(([, v]) => v)).toString() : '';
    return this.request<any[]>(`/monitors${query}`);
  }

  async getMonitor(id: string) {
    return this.request<any>(`/monitors/${id}`);
  }

  async createMonitor(data: any) {
    return this.request<any>('/monitors', { method: 'POST', body: JSON.stringify(data) });
  }

  async updateMonitor(id: string, data: any) {
    return this.request<any>(`/monitors/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }

  async deleteMonitor(id: string) {
    return this.request<any>(`/monitors/${id}`, { method: 'DELETE' });
  }

  async pauseMonitor(id: string) {
    return this.request<any>(`/monitors/${id}/pause`, { method: 'POST' });
  }

  async resumeMonitor(id: string) {
    return this.request<any>(`/monitors/${id}/resume`, { method: 'POST' });
  }

  // Incidents
  async getIncidents() {
    return this.request<any[]>('/incidents');
  }

  async acknowledgeIncident(id: string) {
    return this.request<any>(`/incidents/${id}/acknowledge`, { method: 'POST' });
  }

  async resolveIncident(id: string) {
    return this.request<any>(`/incidents/${id}/resolve`, { method: 'POST' });
  }

  // Alerts
  async getAlerts(params?: { search?: string; startDate?: string; endDate?: string; account?: string; monitorId?: string }) {
    const query = params ? '?' + new URLSearchParams(Object.entries(params).filter(([, v]) => v) as [string, string][]).toString() : '';
    return this.request<any[]>(`/alerts${query}`);
  }

  async getAlertFilters() {
    return this.request<{ accounts: string[]; monitors: { id: string; name: string }[] }>('/alerts/filters');
  }

  async getUnreadAlertCount() {
    return this.request<{ count: number }>('/alerts/unread-count');
  }

  async markAlertRead(id: string) {
    return this.request<any>(`/alerts/${id}/read`, { method: 'PUT' });
  }

  async markAllAlertsRead() {
    return this.request<any>('/alerts/mark-all', { method: 'PUT' });
  }

  // Dashboard
  async getDashboardStats() {
    return this.request<any>('/dashboard/stats');
  }

  // Maintenance
  async getMaintenanceWindows() {
    return this.request<any[]>('/maintenance');
  }

  async createMaintenance(data: any) {
    return this.request<any>('/maintenance', { method: 'POST', body: JSON.stringify(data) });
  }

  async cancelMaintenance(id: string) {
    return this.request<any>(`/maintenance/${id}/cancel`, { method: 'PUT' });
  }

  // Status Pages
  async getStatusPages() {
    return this.request<any[]>('/status-pages');
  }

  async createStatusPage(data: any) {
    return this.request<any>('/status-pages', { method: 'POST', body: JSON.stringify(data) });
  }

  // Audit Logs
  async getAuditLogs(limit = 50, offset = 0) {
    return this.request<any[]>(`/audit-logs?limit=${limit}&offset=${offset}`);
  }

  // Users
  async getUsers() {
    return this.request<any[]>('/users');
  }

  async createUser(data: any) {
    return this.request<any>('/users', { method: 'POST', body: JSON.stringify(data) });
  }

  async updateUserRole(id: string, role: string) {
    return this.request<any>(`/users/${id}/role`, { method: 'PUT', body: JSON.stringify({ role }) });
  }

  async deactivateUser(id: string) {
    return this.request<any>(`/users/${id}`, { method: 'DELETE' });
  }

  // Organization
  async getOrganization() {
    return this.request<any>('/organizations/current');
  }

  async updateOrganization(data: any) {
    return this.request<any>('/organizations/current', { method: 'PUT', body: JSON.stringify(data) });
  }

  // Reports
  async getDowntimeEvents(params?: { startDate?: string; endDate?: string; monitorId?: string }) {
    const query = params ? '?' + new URLSearchParams(Object.entries(params).filter(([, v]) => v) as [string, string][]).toString() : '';
    return this.request<any[]>(`/reports/downtime-events${query}`);
  }

  async getUptimeReports(params?: { monitorId?: string; period?: string }) {
    const query = params ? '?' + new URLSearchParams(Object.entries(params).filter(([, v]) => v) as [string, string][]).toString() : '';
    return this.request<any[]>(`/reports/uptime${query}`);
  }
}

export const apiService = new ApiService();
