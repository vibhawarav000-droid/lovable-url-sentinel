const express = require('express');
const db = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const router = express.Router();

router.get('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    const result = await db.query(
      `SELECT * FROM audit_logs WHERE organization_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
      [req.user.organization_id, parseInt(limit), parseInt(offset)]
    );
    res.json(result.rows.map(r => ({
      id: r.id, userId: r.user_id, userName: r.user_name, userEmail: r.user_email,
      action: r.action, resource: r.resource, resourceId: r.resource_id,
      details: r.details, ipAddress: r.ip_address, userAgent: r.user_agent,
      timestamp: r.created_at,
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
