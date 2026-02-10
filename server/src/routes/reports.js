const express = require('express');
const db = require('../config/database');
const { authenticate } = require('../middleware/auth');
const router = express.Router();

// GET /api/reports/downtime-events
router.get('/downtime-events', authenticate, async (req, res) => {
  try {
    const { startDate, endDate, monitorId } = req.query;
    let query = 'SELECT * FROM downtime_events WHERE organization_id = $1';
    const params = [req.user.organization_id];
    let idx = 2;

    if (startDate) { query += ` AND start_time >= $${idx++}`; params.push(startDate); }
    if (endDate) { query += ` AND start_time <= $${idx++}`; params.push(endDate); }
    if (monitorId) { query += ` AND monitor_id = $${idx++}`; params.push(monitorId); }

    query += ' ORDER BY start_time DESC';
    const result = await db.query(query, params);
    res.json(result.rows.map(r => ({
      id: r.id, monitorId: r.monitor_id, monitorName: r.monitor_name || '',
      accountName: r.account_name, environment: r.environment,
      startTime: r.start_time, endTime: r.end_time, duration: r.duration,
      httpCode: r.http_code, reason: r.reason, notes: r.notes, type: r.event_type,
      plannedDowntime: r.planned_downtime, actualDowntime: r.actual_downtime,
      uptimeDuringMaintenance: r.uptime_during_maintenance,
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/reports/uptime
router.get('/uptime', authenticate, async (req, res) => {
  try {
    const { monitorId, period = 'monthly' } = req.query;
    let query = `SELECT m.id, m.name, m.account_name, m.environment, m.uptime
                 FROM monitors m WHERE m.organization_id = $1`;
    const params = [req.user.organization_id];
    if (monitorId) { query += ' AND m.id = $2'; params.push(monitorId); }

    const result = await db.query(query, params);
    res.json(result.rows.map(r => ({
      monitorId: r.id, monitorName: r.name, accountName: r.account_name,
      environment: r.environment, period, totalUptime: parseFloat(r.uptime),
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
