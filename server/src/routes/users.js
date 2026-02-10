const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { logAction } = require('../middleware/auditLog');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

// GET /api/users
router.get('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, email, name, role, avatar_url, is_active, created_at FROM users WHERE organization_id = $1 ORDER BY name`,
      [req.user.organization_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/users (invite)
router.post('/', authenticate, authorize('super_admin'), async (req, res) => {
  try {
    const { email, name, role, password } = req.body;
    const hash = await bcrypt.hash(password || 'changeme123', 10);
    const id = uuidv4();
    await db.query(
      `INSERT INTO users (id, email, password_hash, name, role, organization_id) VALUES ($1,$2,$3,$4,$5,$6)`,
      [id, email.toLowerCase(), hash, name, role || 'viewer', req.user.organization_id]
    );
    await logAction(req.user.id, req.user.name, req.user.email, 'user.invite', 'User', id, `Invited user "${name}" with role "${role}"`, req);
    res.status(201).json({ id, message: 'User created' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/users/:id/role
router.put('/:id/role', authenticate, authorize('super_admin'), async (req, res) => {
  try {
    const { role } = req.body;
    await db.query('UPDATE users SET role=$1 WHERE id=$2 AND organization_id=$3', [role, req.params.id, req.user.organization_id]);
    res.json({ message: 'Role updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/users/:id
router.delete('/:id', authenticate, authorize('super_admin'), async (req, res) => {
  try {
    await db.query('UPDATE users SET is_active=false WHERE id=$1 AND organization_id=$2', [req.params.id, req.user.organization_id]);
    res.json({ message: 'User deactivated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
