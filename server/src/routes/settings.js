const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

// Get current settings for the organization
router.get('/', authenticate, async (req, res) => {
  try {
    const { rows } = await req.db.query(
      'SELECT * FROM organization_settings WHERE organization_id = $1',
      [req.user.organization_id]
    );
    res.json(rows[0] || {});
  } catch (err) {
    console.error('Error fetching settings:', err);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// Update notification settings
router.put('/notifications', authenticate, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    const {
      email_enabled,
      slack_enabled,
      sms_enabled,
      webhook_enabled,
      alert_threshold,
      confirmation_period,
    } = req.body;

    const { rows } = await req.db.query(
      `INSERT INTO organization_settings (
        organization_id, email_enabled, slack_enabled, sms_enabled,
        webhook_enabled, alert_threshold, confirmation_period, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      ON CONFLICT (organization_id)
      DO UPDATE SET
        email_enabled = COALESCE($2, organization_settings.email_enabled),
        slack_enabled = COALESCE($3, organization_settings.slack_enabled),
        sms_enabled = COALESCE($4, organization_settings.sms_enabled),
        webhook_enabled = COALESCE($5, organization_settings.webhook_enabled),
        alert_threshold = COALESCE($6, organization_settings.alert_threshold),
        confirmation_period = COALESCE($7, organization_settings.confirmation_period),
        updated_at = NOW()
      RETURNING *`,
      [req.user.organization_id, email_enabled, slack_enabled, sms_enabled, webhook_enabled, alert_threshold, confirmation_period]
    );

    res.json(rows[0]);
  } catch (err) {
    console.error('Error updating notification settings:', err);
    res.status(500).json({ error: 'Failed to update notification settings' });
  }
});

// Update appearance settings
router.put('/appearance', authenticate, async (req, res) => {
  try {
    const { default_theme, timezone, date_format } = req.body;

    const { rows } = await req.db.query(
      `INSERT INTO organization_settings (
        organization_id, default_theme, timezone, date_format, updated_at
      ) VALUES ($1, $2, $3, $4, NOW())
      ON CONFLICT (organization_id)
      DO UPDATE SET
        default_theme = COALESCE($2, organization_settings.default_theme),
        timezone = COALESCE($3, organization_settings.timezone),
        date_format = COALESCE($4, organization_settings.date_format),
        updated_at = NOW()
      RETURNING *`,
      [req.user.organization_id, default_theme, timezone, date_format]
    );

    res.json(rows[0]);
  } catch (err) {
    console.error('Error updating appearance settings:', err);
    res.status(500).json({ error: 'Failed to update appearance settings' });
  }
});

// Update password
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

// Connect an integration
router.post('/integrations/:name/connect', authenticate, authorize('admin', 'super_admin'), async (req, res) => {
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

// Disconnect an integration
router.post('/integrations/:name/disconnect', authenticate, authorize('admin', 'super_admin'), async (req, res) => {
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
