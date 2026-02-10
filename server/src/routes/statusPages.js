const express = require('express');
const db = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM status_pages WHERE organization_id = $1 ORDER BY name', [req.user.organization_id]);
    res.json(result.rows.map(r => ({
      id: r.id, name: r.name, slug: r.slug, domain: r.domain, isPublic: r.is_public,
      monitors: r.monitor_ids, theme: r.theme, logo: r.logo_url, headerText: r.header_text,
      footerText: r.footer_text, createdAt: r.created_at, updatedAt: r.updated_at,
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { name, slug, domain, isPublic, monitors, theme, headerText, footerText } = req.body;
    const result = await db.query(
      `INSERT INTO status_pages (id,name,slug,domain,is_public,monitor_ids,theme,header_text,footer_text,organization_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [uuidv4(), name, slug, domain, isPublic !== false, monitors || [], theme || 'auto', headerText, footerText, req.user.organization_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
