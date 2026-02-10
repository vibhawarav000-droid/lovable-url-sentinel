const express = require('express');
const db = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { logAction } = require('../middleware/auditLog');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

// GET /api/maintenance
router.get('/', authenticate, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM maintenance_windows WHERE organization_id = $1 ORDER BY start_time DESC',
      [req.user.organization_id]
    );
    res.json(result.rows.map(formatMaintenance));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/maintenance
router.post('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { name, description, accountName, monitorIds, startTime, endTime, timezone, isRecurring, recurrence } = req.body;
    const id = uuidv4();
    await db.query(
      `INSERT INTO maintenance_windows (id, name, description, account_name, monitor_ids, start_time, end_time, timezone, created_by, is_recurring, recurrence_frequency, recurrence_interval, recurrence_days_of_week, recurrence_end_date, organization_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
      [id, name, description, accountName, monitorIds, startTime, endTime, timezone || 'UTC', req.user.id, isRecurring || false,
       recurrence?.frequency, recurrence?.interval, recurrence?.daysOfWeek, recurrence?.endDate, req.user.organization_id]
    );
    await logAction(req.user.id, req.user.name, req.user.email, 'maintenance.create', 'Maintenance', id, `Scheduled maintenance "${name}"`, req);
    res.status(201).json({ id, message: 'Maintenance window created' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/maintenance/:id/cancel
router.put('/:id/cancel', authenticate, authorize('admin'), async (req, res) => {
  try {
    await db.query(`UPDATE maintenance_windows SET status='cancelled' WHERE id=$1 AND organization_id=$2`, [req.params.id, req.user.organization_id]);
    res.json({ message: 'Maintenance cancelled' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function formatMaintenance(row) {
  return {
    id: row.id, name: row.name, description: row.description, accountName: row.account_name,
    monitorIds: row.monitor_ids, startTime: row.start_time, endTime: row.end_time,
    timezone: row.timezone, status: row.status, createdBy: row.created_by,
    createdAt: row.created_at, updatedAt: row.updated_at, isRecurring: row.is_recurring,
    recurrence: row.recurrence_frequency ? {
      frequency: row.recurrence_frequency, interval: row.recurrence_interval,
      daysOfWeek: row.recurrence_days_of_week, endDate: row.recurrence_end_date,
    } : undefined,
  };
}

module.exports = router;
