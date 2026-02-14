const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

// Get current settings for the organization
router.get('/', authenticate, async (req, res) => {
  try {
    const { rows } = await req.db.query(
      'SELECT * FROM settings WHERE organization_id = $1',
      [req.user.organization_id]
    );
    res.json(rows[0] || {});
  } catch (err) {
    console.error('Error fetching settings:', err);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// Update notification settings (Super Admin only)
router.put('/notifications', authenticate, authorize('super_admin'), async (req, res) => {
  try {
    const {
      email_enabled,
      slack_enabled,
      sms_enabled,
      webhook_enabled,
      alert_threshold,
      confirmation_checks,
    } = req.body;

    const { rows } = await req.db.query(
      `INSERT INTO settings (
        id, organization_id, email_enabled, slack_enabled, sms_enabled,
        webhook_enabled, alert_threshold, confirmation_checks, updated_at
      ) VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, NOW())
      ON CONFLICT (organization_id)
      DO UPDATE SET
        email_enabled = COALESCE($2, settings.email_enabled),
        slack_enabled = COALESCE($3, settings.slack_enabled),
        sms_enabled = COALESCE($4, settings.sms_enabled),
        webhook_enabled = COALESCE($5, settings.webhook_enabled),
        alert_threshold = COALESCE($6, settings.alert_threshold),
        confirmation_checks = COALESCE($7, settings.confirmation_checks),
        updated_at = NOW()
      RETURNING *`,
      [req.user.organization_id, email_enabled, slack_enabled, sms_enabled, webhook_enabled, alert_threshold, confirmation_checks]
    );

    res.json(rows[0]);
  } catch (err) {
    console.error('Error updating notification settings:', err);
    res.status(500).json({ error: 'Failed to update notification settings' });
  }
});

// Update appearance settings (Super Admin only)
router.put('/appearance', authenticate, authorize('super_admin'), async (req, res) => {
  try {
    const { theme, timezone, date_format } = req.body;

    const { rows } = await req.db.query(
      `INSERT INTO settings (
        id, organization_id, theme, timezone, date_format, updated_at
      ) VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW())
      ON CONFLICT (organization_id)
      DO UPDATE SET
        theme = COALESCE($2, settings.theme),
        timezone = COALESCE($3, settings.timezone),
        date_format = COALESCE($4, settings.date_format),
        updated_at = NOW()
      RETURNING *`,
      [req.user.organization_id, theme, timezone, date_format]
    );

    res.json(rows[0]);
  } catch (err) {
    console.error('Error updating appearance settings:', err);
    res.status(500).json({ error: 'Failed to update appearance settings' });
  }
});

// Update password (any authenticated user can change their own password)
router.put('/password', authenticate, async (req, res) => {
  try {
    const { current_password, new_password, confirm_password } = req.body;

    if (!current_password || !new_password || !confirm_password) {
      return res.status(400).json({ error: 'All password fields are required' });
    }

    if (new_password !== confirm_password) {
      return res.status(400).json({ error: 'New passwords do not match' });
    }

    if (new_password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const bcrypt = require('bcryptjs');

    // Verify current password
    const { rows: userRows } = await req.db.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [req.user.id]
    );

    if (!userRows.length) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isValid = await bcrypt.compare(current_password, userRows[0].password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Hash and update new password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(new_password, salt);

    await req.db.query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [password_hash, req.user.id]
    );

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error('Error updating password:', err);
    res.status(500).json({ error: 'Failed to update password' });
  }
});

// Update security settings (Super Admin only)
router.put('/security', authenticate, authorize('super_admin'), async (req, res) => {
  try {
    const { two_factor_enabled } = req.body;

    const { rows } = await req.db.query(
      `INSERT INTO settings (
        id, organization_id, two_factor_enabled, updated_at
      ) VALUES (gen_random_uuid(), $1, $2, NOW())
      ON CONFLICT (organization_id)
      DO UPDATE SET
        two_factor_enabled = COALESCE($2, settings.two_factor_enabled),
        updated_at = NOW()
      RETURNING *`,
      [req.user.organization_id, two_factor_enabled]
    );

    res.json(rows[0]);
  } catch (err) {
    console.error('Error updating security settings:', err);
    res.status(500).json({ error: 'Failed to update security settings' });
  }
});

// Get integrations status
router.get('/integrations', authenticate, async (req, res) => {
  try {
    const { rows } = await req.db.query(
      'SELECT * FROM integrations WHERE organization_id = $1',
      [req.user.organization_id]
    );
    res.json(rows);
  } catch (err) {
    console.error('Error fetching integrations:', err);
    res.status(500).json({ error: 'Failed to fetch integrations' });
  }
});

// Connect an integration (Super Admin only)
router.post('/integrations/:name/connect', authenticate, authorize('super_admin'), async (req, res) => {
  try {
    const { name } = req.params;
    const { config } = req.body;

    const validIntegrations = ['slack', 'pagerduty', 'discord', 'microsoft_teams'];
    if (!validIntegrations.includes(name.toLowerCase())) {
      return res.status(400).json({ error: 'Invalid integration name' });
    }

    const { rows } = await req.db.query(
      `INSERT INTO integrations (organization_id, name, config, connected, connected_at, updated_at)
       VALUES ($1, $2, $3, true, NOW(), NOW())
       ON CONFLICT (organization_id, name)
       DO UPDATE SET config = $3, connected = true, connected_at = NOW(), updated_at = NOW()
       RETURNING *`,
      [req.user.organization_id, name.toLowerCase(), JSON.stringify(config || {})]
    );

    res.json(rows[0]);
  } catch (err) {
    console.error('Error connecting integration:', err);
    res.status(500).json({ error: 'Failed to connect integration' });
  }
});

// Disconnect an integration (Super Admin only)
router.post('/integrations/:name/disconnect', authenticate, authorize('super_admin'), async (req, res) => {
  try {
    const { name } = req.params;

    await req.db.query(
      `UPDATE integrations SET connected = false, updated_at = NOW()
       WHERE organization_id = $1 AND name = $2`,
      [req.user.organization_id, name.toLowerCase()]
    );

    res.json({ message: `${name} disconnected successfully` });
  } catch (err) {
    console.error('Error disconnecting integration:', err);
    res.status(500).json({ error: 'Failed to disconnect integration' });
  }
});

module.exports = router;
