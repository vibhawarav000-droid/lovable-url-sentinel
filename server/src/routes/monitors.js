const express = require('express');
const db = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { logAction } = require('../middleware/auditLog');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

// GET /api/monitors
router.get('/', authenticate, async (req, res) => {
  try {
    const { environment, account_name, status, search } = req.query;
    let query = `SELECT m.*, 
      COALESCE(json_agg(json_build_object('timestamp', rh.checked_at, 'responseTime', rh.response_time, 'status', rh.status, 'httpCode', rh.http_code) ORDER BY rh.checked_at DESC) FILTER (WHERE rh.id IS NOT NULL), '[]') as response_history
      FROM monitors m
      LEFT JOIN LATERAL (SELECT * FROM response_history WHERE monitor_id = m.id ORDER BY checked_at DESC LIMIT 720) rh ON true
      WHERE m.organization_id = $1`;
    const params = [req.user.organization_id];
    let idx = 2;

    if (environment) { query += ` AND m.environment = $${idx++}`; params.push(environment); }
    if (account_name) { query += ` AND m.account_name = $${idx++}`; params.push(account_name); }
    if (status) { query += ` AND m.status = $${idx++}`; params.push(status); }
    if (search) { query += ` AND (m.name ILIKE $${idx} OR m.url ILIKE $${idx})`; params.push(`%${search}%`); idx++; }

    query += ` GROUP BY m.id ORDER BY m.name`;
    const result = await db.query(query, params);

    // Also fetch uptime history
    for (const monitor of result.rows) {
      const uptimeResult = await db.query(
        `SELECT date, status, uptime FROM uptime_history WHERE monitor_id = $1 ORDER BY date DESC LIMIT 90`,
        [monitor.id]
      );
      monitor.uptime_history = uptimeResult.rows;
    }

    res.json(result.rows.map(formatMonitor));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/monitors/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM monitors WHERE id = $1 AND organization_id = $2', [req.params.id, req.user.organization_id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Monitor not found' });
    res.json(formatMonitor(result.rows[0]));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/monitors
router.post('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { name, url, checkInterval, environment, timezone, accountName, timeout } = req.body;
    const id = uuidv4();
    const result = await db.query(
      `INSERT INTO monitors (id, name, url, check_interval, environment, timezone, account_name, timeout, organization_id, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [id, name, url, checkInterval || 60, environment || 'production', timezone || 'UTC', accountName, timeout || 30, req.user.organization_id, req.user.id]
    );
    await logAction(req.user.id, req.user.name, req.user.email, 'monitor.create', 'Monitor', id, `Created monitor "${name}"`, req);
    res.status(201).json(formatMonitor(result.rows[0]));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/monitors/:id
router.put('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { name, url, checkInterval, environment, timezone, accountName, timeout, status } = req.body;
    const result = await db.query(
      `UPDATE monitors SET name=COALESCE($1,name), url=COALESCE($2,url), check_interval=COALESCE($3,check_interval),
       environment=COALESCE($4,environment), timezone=COALESCE($5,timezone), account_name=COALESCE($6,account_name),
       timeout=COALESCE($7,timeout), status=COALESCE($8,status)
       WHERE id=$9 AND organization_id=$10 RETURNING *`,
      [name, url, checkInterval, environment, timezone, accountName, timeout, status, req.params.id, req.user.organization_id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Monitor not found' });
    await logAction(req.user.id, req.user.name, req.user.email, 'monitor.update', 'Monitor', req.params.id, `Updated monitor "${result.rows[0].name}"`, req);
    res.json(formatMonitor(result.rows[0]));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/monitors/:id
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const result = await db.query('DELETE FROM monitors WHERE id=$1 AND organization_id=$2 RETURNING name', [req.params.id, req.user.organization_id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Monitor not found' });
    await logAction(req.user.id, req.user.name, req.user.email, 'monitor.delete', 'Monitor', req.params.id, `Deleted monitor "${result.rows[0].name}"`, req);
    res.json({ message: 'Monitor deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/monitors/:id/pause
router.post('/:id/pause', authenticate, authorize('admin'), async (req, res) => {
  try {
    await db.query(`UPDATE monitors SET status='paused', is_paused=true WHERE id=$1 AND organization_id=$2`, [req.params.id, req.user.organization_id]);
    await logAction(req.user.id, req.user.name, req.user.email, 'monitor.pause', 'Monitor', req.params.id, 'Paused monitor', req);
    res.json({ message: 'Monitor paused' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/monitors/:id/resume
router.post('/:id/resume', authenticate, authorize('admin'), async (req, res) => {
  try {
    await db.query(`UPDATE monitors SET status='up', is_paused=false WHERE id=$1 AND organization_id=$2`, [req.params.id, req.user.organization_id]);
    await logAction(req.user.id, req.user.name, req.user.email, 'monitor.resume', 'Monitor', req.params.id, 'Resumed monitor', req);
    res.json({ message: 'Monitor resumed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function formatMonitor(row) {
  return {
    id: row.id,
    name: row.name,
    url: row.url,
    type: row.type,
    status: row.status,
    uptime: parseFloat(row.uptime),
    uptimeToday: parseFloat(row.uptime_today),
    responseTime: row.response_time,
    avgResponseTime: row.avg_response_time,
    minResponseTime: row.min_response_time,
    maxResponseTime: row.max_response_time,
    checkInterval: row.check_interval,
    timeout: row.timeout,
    sslExpiry: row.ssl_expiry,
    sslDaysRemaining: row.ssl_days_remaining,
    lastChecked: row.last_checked,
    lastDowntime: row.last_downtime,
    createdAt: row.created_at,
    tags: row.tags || [],
    alertCount: row.alert_count,
    responseHistory: row.response_history || [],
    uptimeHistory: row.uptime_history || [],
    environment: row.environment,
    accountName: row.account_name,
    timezone: row.timezone,
    httpCode: row.http_code,
    downtimeReason: row.downtime_reason,
    isPaused: row.is_paused,
    maintenanceId: row.maintenance_id,
  };
}

module.exports = router;
