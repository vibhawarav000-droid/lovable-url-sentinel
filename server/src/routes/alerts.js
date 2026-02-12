const express = require('express');
const db = require('../config/database');
const { authenticate } = require('../middleware/auth');
const router = express.Router();

// GET /api/alerts - with search, date range, account, monitor filters
router.get('/', authenticate, async (req, res) => {
  try {
    const { search, startDate, endDate, account, monitorId } = req.query;

    let query = `
      SELECT a.*, m.name as monitor_name, m.account_name
      FROM alerts a
      JOIN monitors m ON a.monitor_id = m.id
      WHERE a.organization_id = $1
    `;
    const params = [req.user.organization_id];
    let idx = 2;

    if (search) {
      query += ` AND (a.message ILIKE $${idx} OR m.name ILIKE $${idx})`;
      params.push(`%${search}%`);
      idx++;
    }

    if (startDate && endDate) {
      query += ` AND a.created_at BETWEEN $${idx} AND $${idx + 1}`;
      params.push(startDate, endDate);
      idx += 2;
    }

    if (account) {
      query += ` AND m.account_name = $${idx}`;
      params.push(account);
      idx++;
    }

    if (monitorId) {
      query += ` AND m.id = $${idx}`;
      params.push(monitorId);
      idx++;
    }

    query += ` ORDER BY a.created_at DESC`;

    const result = await db.query(query, params);
    res.json(result.rows.map(r => ({
      id: r.id, monitorId: r.monitor_id, monitorName: r.monitor_name,
      accountName: r.account_name,
      type: r.type, severity: r.severity, message: r.message,
      createdAt: r.created_at, read: r.is_read,
    })));
  } catch (err) {
    console.error('GET alerts error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/alerts/filters - get unique accounts and monitors for dropdowns
router.get('/filters', authenticate, async (req, res) => {
  try {
    const accounts = await db.query(
      `SELECT DISTINCT m.account_name FROM alerts a JOIN monitors m ON a.monitor_id = m.id WHERE a.organization_id = $1 AND m.account_name IS NOT NULL ORDER BY m.account_name`,
      [req.user.organization_id]
    );
    const monitors = await db.query(
      `SELECT DISTINCT m.id, m.name FROM alerts a JOIN monitors m ON a.monitor_id = m.id WHERE a.organization_id = $1 ORDER BY m.name`,
      [req.user.organization_id]
    );
    res.json({
      accounts: accounts.rows.map(r => r.account_name),
      monitors: monitors.rows.map(r => ({ id: r.id, name: r.name })),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/alerts/unread-count
router.get('/unread-count', authenticate, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT COUNT(*) as count FROM alerts WHERE organization_id = $1 AND is_read = false',
      [req.user.organization_id]
    );
    res.json({ count: parseInt(result.rows[0].count, 10) });
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

// PUT /api/alerts/mark-all - mark all as read
router.put('/mark-all', authenticate, async (req, res) => {
  try {
    await db.query('UPDATE alerts SET is_read=true WHERE organization_id=$1', [req.user.organization_id]);
    res.json({ message: 'All alerts marked as read' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
