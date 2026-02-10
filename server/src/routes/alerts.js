const express = require('express');
const db = require('../config/database');
const { authenticate } = require('../middleware/auth');
const router = express.Router();

// GET /api/alerts
router.get('/', authenticate, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT a.*, m.name as monitor_name FROM alerts a
       JOIN monitors m ON a.monitor_id = m.id
       WHERE a.organization_id = $1 ORDER BY a.created_at DESC`,
      [req.user.organization_id]
    );
    res.json(result.rows.map(r => ({
      id: r.id, monitorId: r.monitor_id, monitorName: r.monitor_name,
      type: r.type, severity: r.severity, message: r.message,
      createdAt: r.created_at, read: r.is_read,
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/alerts/:id/read
router.put('/:id/read', authenticate, async (req, res) => {
  try {
    await db.query('UPDATE alerts SET is_read=true WHERE id=$1 AND organization_id=$2', [req.params.id, req.user.organization_id]);
    res.json({ message: 'Alert marked as read' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
