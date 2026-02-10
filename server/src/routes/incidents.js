const express = require('express');
const db = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { logAction } = require('../middleware/auditLog');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

// GET /api/incidents
router.get('/', authenticate, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT i.*, m.name as monitor_name,
       COALESCE(json_agg(json_build_object('id', t.id, 'timestamp', t.created_at, 'type', t.type, 'message', t.message, 'user', t.user_name) ORDER BY t.created_at) FILTER (WHERE t.id IS NOT NULL), '[]') as timeline
       FROM incidents i
       JOIN monitors m ON i.monitor_id = m.id
       LEFT JOIN incident_timeline t ON t.incident_id = i.id
       WHERE i.organization_id = $1
       GROUP BY i.id, m.name
       ORDER BY i.started_at DESC`,
      [req.user.organization_id]
    );
    res.json(result.rows.map(formatIncident));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/incidents/:id/acknowledge
router.post('/:id/acknowledge', authenticate, authorize('admin'), async (req, res) => {
  try {
    await db.query(`UPDATE incidents SET status='acknowledged', acknowledged_at=NOW(), acknowledged_by=$1 WHERE id=$2 AND organization_id=$3`,
      [req.user.id, req.params.id, req.user.organization_id]);
    await db.query(`INSERT INTO incident_timeline (id, incident_id, type, message, user_name) VALUES ($1,$2,'acknowledged','Incident acknowledged',$3)`,
      [uuidv4(), req.params.id, req.user.name]);
    await logAction(req.user.id, req.user.name, req.user.email, 'incident.acknowledge', 'Incident', req.params.id, 'Acknowledged incident', req);
    res.json({ message: 'Incident acknowledged' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/incidents/:id/resolve
router.post('/:id/resolve', authenticate, authorize('admin'), async (req, res) => {
  try {
    await db.query(`UPDATE incidents SET status='resolved', resolved_at=NOW(), duration=EXTRACT(EPOCH FROM (NOW()-started_at))/60 WHERE id=$1 AND organization_id=$2`,
      [req.params.id, req.user.organization_id]);
    await db.query(`INSERT INTO incident_timeline (id, incident_id, type, message, user_name) VALUES ($1,$2,'resolved','Incident resolved',$3)`,
      [uuidv4(), req.params.id, req.user.name]);
    await logAction(req.user.id, req.user.name, req.user.email, 'incident.resolve', 'Incident', req.params.id, 'Resolved incident', req);
    res.json({ message: 'Incident resolved' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function formatIncident(row) {
  return {
    id: row.id,
    monitorId: row.monitor_id,
    monitorName: row.monitor_name,
    status: row.status,
    severity: row.severity,
    title: row.title,
    description: row.description,
    startedAt: row.started_at,
    resolvedAt: row.resolved_at,
    acknowledgedAt: row.acknowledged_at,
    acknowledgedBy: row.acknowledged_by,
    duration: row.duration,
    affectedRegions: row.affected_regions || [],
    timeline: row.timeline || [],
  };
}

module.exports = router;
