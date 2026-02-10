const express = require('express');
const db = require('../config/database');
const { authenticate } = require('../middleware/auth');
const router = express.Router();

// GET /api/dashboard/stats
router.get('/stats', authenticate, async (req, res) => {
  try {
    const orgId = req.user.organization_id;
    const monitors = await db.query('SELECT status, is_paused, uptime, response_time FROM monitors WHERE organization_id = $1', [orgId]);
    const incidents = await db.query('SELECT status FROM incidents WHERE organization_id = $1', [orgId]);

    const rows = monitors.rows;
    const up = rows.filter(m => m.status === 'up').length;
    const down = rows.filter(m => m.status === 'down').length;
    const degraded = rows.filter(m => m.status === 'degraded').length;
    const paused = rows.filter(m => m.status === 'paused' || m.is_paused).length;
    const maintenance = rows.filter(m => m.status === 'maintenance').length;
    const active = rows.filter(m => m.status !== 'down' && m.status !== 'paused');
    const avgResponse = active.length > 0 ? Math.round(active.reduce((s, m) => s + m.response_time, 0) / active.length) : 0;
    const overallUptime = rows.length > 0 ? Math.round(rows.reduce((s, m) => s + parseFloat(m.uptime), 0) / rows.length * 10) / 10 : 100;
    const activeIncidents = incidents.rows.filter(i => i.status !== 'resolved').length;

    res.json({
      totalMonitors: rows.length, monitorsUp: up, monitorsDown: down,
      monitorsDegraded: degraded, monitorsPaused: paused, monitorsMaintenance: maintenance,
      avgResponseTime: avgResponse, totalIncidents: incidents.rows.length,
      activeIncidents, overallUptime,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
