const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

const logAction = async (userId, userName, userEmail, action, resource, resourceId, details, req) => {
  try {
    await db.query(
      `INSERT INTO audit_logs (id, user_id, user_name, user_email, action, resource, resource_id, details, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [uuidv4(), userId, userName, userEmail, action, resource, resourceId, details,
       req.ip || req.connection?.remoteAddress || 'unknown',
       req.headers['user-agent'] || 'unknown']
    );
  } catch (err) {
    console.error('Audit log error:', err.message);
  }
};

module.exports = { logAction };
