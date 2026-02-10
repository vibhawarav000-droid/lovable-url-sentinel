const express = require('express');
const db = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const router = express.Router();

// GET /api/organizations/current
router.get('/current', authenticate, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM organizations WHERE id = $1', [req.user.organization_id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Organization not found' });
    const org = result.rows[0];

    const monitorsCount = await db.query('SELECT COUNT(*) FROM monitors WHERE organization_id = $1', [org.id]);
    const usersCount = await db.query('SELECT COUNT(*) FROM users WHERE organization_id = $1 AND is_active = true', [org.id]);

    res.json({
      id: org.id, name: org.name, slug: org.slug, plan: org.plan,
      monitorsLimit: org.monitors_limit, monitorsUsed: parseInt(monitorsCount.rows[0].count),
      usersLimit: org.users_limit, usersCount: parseInt(usersCount.rows[0].count),
      createdAt: org.created_at,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/organizations/current
router.put('/current', authenticate, authorize('super_admin'), async (req, res) => {
  try {
    const { name } = req.body;
    await db.query('UPDATE organizations SET name=$1 WHERE id=$2', [name, req.user.organization_id]);
    res.json({ message: 'Organization updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
