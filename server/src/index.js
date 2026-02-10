require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const monitorRoutes = require('./routes/monitors');
const incidentRoutes = require('./routes/incidents');
const alertRoutes = require('./routes/alerts');
const maintenanceRoutes = require('./routes/maintenance');
const statusPageRoutes = require('./routes/statusPages');
const auditLogRoutes = require('./routes/auditLogs');
const userRoutes = require('./routes/users');
const organizationRoutes = require('./routes/organizations');
const dashboardRoutes = require('./routes/dashboard');
const reportRoutes = require('./routes/reports');
const { startMonitoringCron } = require('./services/monitoringService');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/monitors', monitorRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/status-pages', statusPageRoutes);
app.use('/api/audit-logs', auditLogRoutes);
app.use('/api/users', userRoutes);
app.use('/api/organizations', organizationRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

app.listen(PORT, () => {
  console.log(`UptimeHost server running on port ${PORT}`);
  startMonitoringCron();
});
