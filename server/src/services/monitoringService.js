const cron = require('node-cron');
const axios = require('axios');
const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

const checkMonitor = async (monitor) => {
  const start = Date.now();
  try {
    const response = await axios.get(monitor.url, { timeout: monitor.timeout * 1000, validateStatus: () => true });
    const responseTime = Date.now() - start;
    const httpCode = response.status;
    const status = httpCode >= 200 && httpCode < 400 ? 'up' : httpCode >= 500 ? 'down' : 'degraded';

    await db.query(
      `INSERT INTO response_history (id, monitor_id, response_time, status, http_code) VALUES ($1,$2,$3,$4,$5)`,
      [uuidv4(), monitor.id, responseTime, status, httpCode]
    );

    await db.query(
      `UPDATE monitors SET response_time=$1, http_code=$2, status=$3, last_checked=NOW() WHERE id=$4`,
      [responseTime, httpCode, status, monitor.id]
    );

    // Create alert if down
    if (status === 'down') {
      await db.query(
        `INSERT INTO alerts (id, monitor_id, type, severity, message, organization_id) VALUES ($1,$2,'down','critical',$3,$4)`,
        [uuidv4(), monitor.id, `Server returned ${httpCode}`, monitor.organization_id]
      );
    }
  } catch (err) {
    await db.query(
      `INSERT INTO response_history (id, monitor_id, response_time, status) VALUES ($1,$2,0,'down')`,
      [uuidv4(), monitor.id]
    );
    await db.query(
      `UPDATE monitors SET response_time=0, status='down', last_checked=NOW(), downtime_reason=$1 WHERE id=$2`,
      [err.message, monitor.id]
    );
    await db.query(
      `INSERT INTO alerts (id, monitor_id, type, severity, message, organization_id) VALUES ($1,$2,'down','critical',$3,$4)`,
      [uuidv4(), monitor.id, err.message, monitor.organization_id]
    );
  }
};

const startMonitoringCron = () => {
  // Run every minute
  cron.schedule('* * * * *', async () => {
    try {
      const result = await db.query(
        `SELECT * FROM monitors WHERE is_paused = false AND status != 'maintenance'`
      );
      for (const monitor of result.rows) {
        checkMonitor(monitor).catch(err => console.error(`Check failed for ${monitor.name}:`, err.message));
      }
    } catch (err) {
      console.error('Cron error:', err.message);
    }
  });
  console.log('Monitoring cron job started (every 60s)');
};

module.exports = { startMonitoringCron, checkMonitor };
