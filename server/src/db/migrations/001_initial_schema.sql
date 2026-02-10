-- UptimeHost Database Schema

-- Enums
CREATE TYPE user_role AS ENUM ('super_admin', 'admin', 'viewer');
CREATE TYPE monitor_status AS ENUM ('up', 'down', 'degraded', 'paused', 'maintenance');
CREATE TYPE monitor_type AS ENUM ('http', 'https', 'tcp', 'ping', 'dns');
CREATE TYPE environment_type AS ENUM ('production', 'uat', 'pre-prod', 'internal');
CREATE TYPE incident_status AS ENUM ('ongoing', 'resolved', 'acknowledged');
CREATE TYPE incident_severity AS ENUM ('critical', 'major', 'minor');
CREATE TYPE alert_type AS ENUM ('down', 'ssl_expiry', 'response_time', 'degraded', 'expected_down', 'expected_up', 'maintenance');
CREATE TYPE alert_severity AS ENUM ('critical', 'warning', 'info');
CREATE TYPE maintenance_status AS ENUM ('scheduled', 'active', 'completed', 'cancelled');
CREATE TYPE recurrence_frequency AS ENUM ('daily', 'weekly', 'monthly');
CREATE TYPE org_plan AS ENUM ('free', 'pro', 'business', 'enterprise');

-- Organizations
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  plan org_plan NOT NULL DEFAULT 'free',
  monitors_limit INT NOT NULL DEFAULT 10,
  users_limit INT NOT NULL DEFAULT 5,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role user_role NOT NULL DEFAULT 'viewer',
  avatar_url TEXT,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Monitors
CREATE TABLE monitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  type monitor_type NOT NULL DEFAULT 'https',
  status monitor_status NOT NULL DEFAULT 'up',
  uptime DECIMAL(5,2) NOT NULL DEFAULT 100.00,
  uptime_today DECIMAL(5,2) NOT NULL DEFAULT 100.00,
  response_time INT NOT NULL DEFAULT 0,
  avg_response_time INT NOT NULL DEFAULT 0,
  min_response_time INT NOT NULL DEFAULT 0,
  max_response_time INT NOT NULL DEFAULT 0,
  check_interval INT NOT NULL DEFAULT 60,
  timeout INT NOT NULL DEFAULT 30,
  ssl_expiry DATE,
  ssl_days_remaining INT,
  last_checked TIMESTAMPTZ,
  last_downtime TIMESTAMPTZ,
  environment environment_type NOT NULL DEFAULT 'production',
  account_name VARCHAR(255) NOT NULL,
  timezone VARCHAR(100) NOT NULL DEFAULT 'UTC',
  http_code INT,
  downtime_reason TEXT,
  is_paused BOOLEAN NOT NULL DEFAULT false,
  maintenance_id UUID,
  tags TEXT[] DEFAULT '{}',
  alert_count INT NOT NULL DEFAULT 0,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Scheduled windows for monitors
CREATE TABLE scheduled_windows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  monitor_id UUID NOT NULL REFERENCES monitors(id) ON DELETE CASCADE,
  window_type VARCHAR(20) NOT NULL CHECK (window_type IN ('downtime', 'uptime')),
  enabled BOOLEAN NOT NULL DEFAULT false,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  days_of_week INT[] DEFAULT '{0,1,2,3,4,5,6}',
  timezone VARCHAR(100) NOT NULL DEFAULT 'UTC',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Response history
CREATE TABLE response_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  monitor_id UUID NOT NULL REFERENCES monitors(id) ON DELETE CASCADE,
  response_time INT NOT NULL DEFAULT 0,
  status monitor_status NOT NULL,
  http_code INT,
  checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_response_history_monitor ON response_history(monitor_id, checked_at DESC);

-- Uptime history (daily aggregates)
CREATE TABLE uptime_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  monitor_id UUID NOT NULL REFERENCES monitors(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status monitor_status NOT NULL DEFAULT 'up',
  uptime DECIMAL(5,2) NOT NULL DEFAULT 100.00,
  UNIQUE(monitor_id, date)
);

-- Incidents
CREATE TABLE incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  monitor_id UUID NOT NULL REFERENCES monitors(id) ON DELETE CASCADE,
  status incident_status NOT NULL DEFAULT 'ongoing',
  severity incident_severity NOT NULL DEFAULT 'minor',
  title VARCHAR(500) NOT NULL,
  description TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by UUID REFERENCES users(id),
  duration INT,
  affected_regions TEXT[] DEFAULT '{}',
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Incident timeline entries
CREATE TABLE incident_timeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('detected', 'acknowledged', 'update', 'resolved')),
  message TEXT NOT NULL,
  user_name VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Alerts
CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  monitor_id UUID NOT NULL REFERENCES monitors(id) ON DELETE CASCADE,
  type alert_type NOT NULL,
  severity alert_severity NOT NULL DEFAULT 'info',
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Maintenance windows
CREATE TABLE maintenance_windows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  account_name VARCHAR(255) NOT NULL,
  monitor_ids UUID[] NOT NULL DEFAULT '{}',
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  timezone VARCHAR(100) NOT NULL DEFAULT 'UTC',
  status maintenance_status NOT NULL DEFAULT 'scheduled',
  created_by UUID REFERENCES users(id),
  is_recurring BOOLEAN NOT NULL DEFAULT false,
  recurrence_frequency recurrence_frequency,
  recurrence_interval INT,
  recurrence_days_of_week INT[],
  recurrence_end_date DATE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Status pages
CREATE TABLE status_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  domain VARCHAR(255),
  is_public BOOLEAN NOT NULL DEFAULT true,
  monitor_ids UUID[] DEFAULT '{}',
  theme VARCHAR(10) NOT NULL DEFAULT 'auto' CHECK (theme IN ('light', 'dark', 'auto')),
  logo_url TEXT,
  header_text TEXT,
  footer_text TEXT,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Audit logs
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  user_name VARCHAR(255) NOT NULL,
  user_email VARCHAR(255) NOT NULL,
  action VARCHAR(100) NOT NULL,
  resource VARCHAR(100) NOT NULL,
  resource_id VARCHAR(255) NOT NULL,
  details TEXT,
  ip_address VARCHAR(45),
  user_agent TEXT,
  organization_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_org ON audit_logs(organization_id, created_at DESC);

-- Downtime events (for reports)
CREATE TABLE downtime_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  monitor_id UUID NOT NULL REFERENCES monitors(id) ON DELETE CASCADE,
  account_name VARCHAR(255) NOT NULL,
  environment environment_type NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  duration INT NOT NULL DEFAULT 0,
  http_code INT,
  reason TEXT,
  notes TEXT,
  event_type VARCHAR(20) NOT NULL CHECK (event_type IN ('incident', 'maintenance')),
  planned_downtime INT,
  actual_downtime INT,
  uptime_during_maintenance DECIMAL(5,2),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_organizations_updated BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_users_updated BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_monitors_updated BEFORE UPDATE ON monitors FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_incidents_updated BEFORE UPDATE ON incidents FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_maintenance_updated BEFORE UPDATE ON maintenance_windows FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_status_pages_updated BEFORE UPDATE ON status_pages FOR EACH ROW EXECUTE FUNCTION update_updated_at();
