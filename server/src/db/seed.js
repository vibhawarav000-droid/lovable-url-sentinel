require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');

async function seed() {
  try {
    console.log('Seeding database...');

    // Organization
    const orgId = uuidv4();
    await db.query(
      `INSERT INTO organizations (id, name, slug, plan, monitors_limit, users_limit)
       VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (slug) DO NOTHING`,
      [orgId, 'UptimeHost Inc.', 'uptimehost', 'business', 100, 25]
    );

    // Users
    const hash = await bcrypt.hash('admin123', 10);
    const viewerHash = await bcrypt.hash('viewer123', 10);
    const users = [
      [uuidv4(), 'superadmin@uptimehost.com', hash, 'John Super', 'super_admin', orgId],
      [uuidv4(), 'admin@uptimehost.com', hash, 'Jane Admin', 'admin', orgId],
      [uuidv4(), 'viewer@uptimehost.com', viewerHash, 'Bob Viewer', 'viewer', orgId],
    ];

    for (const u of users) {
      await db.query(
        `INSERT INTO users (id, email, password_hash, name, role, organization_id)
         VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (email) DO NOTHING`,
        u
      );
    }

    // Monitors
    const monitors = [
      { name: 'ABC Mobile Prod', url: 'https://abc-mobile.example.com', status: 'up', uptime: 99.9, responseTime: 195, avgResponse: 179, minResponse: 145, maxResponse: 410, env: 'production', account: 'ABC Corp', tz: 'America/New_York', httpCode: 200, tags: ['production', 'mobile'] },
      { name: 'ABC_Pre-Prod', url: 'https://abc-preprod.example.com', status: 'up', uptime: 99.8, responseTime: 276, avgResponse: 274, minResponse: 210, maxResponse: 452, env: 'pre-prod', account: 'ABC Corp', tz: 'America/New_York', httpCode: 200, tags: ['staging', 'web'] },
      { name: 'ABC_UAT', url: 'https://abc-uat.example.com', status: 'up', uptime: 99.5, responseTime: 341, avgResponse: 368, minResponse: 295, maxResponse: 545, env: 'uat', account: 'ABC Corp', tz: 'UTC', httpCode: 200, tags: ['uat'] },
      { name: 'ABCinfra4', url: 'https://abcinfra4.example.com', status: 'maintenance', uptime: 99.7, responseTime: 224, avgResponse: 245, minResponse: 180, maxResponse: 389, env: 'internal', account: 'ABC Corp', tz: 'UTC', httpCode: 200, tags: ['infrastructure'] },
      { name: 'Dspace_Prod', url: 'https://dspace-prod.example.com', status: 'down', uptime: 98.2, responseTime: 0, avgResponse: 312, minResponse: 250, maxResponse: 498, env: 'production', account: 'DSpace Systems', tz: 'America/Chicago', httpCode: 503, downtimeReason: 'Connection timeout', tags: ['production', 'dspace'] },
      { name: 'Pre_Five', url: 'https://pre-five.example.com', status: 'degraded', uptime: 99.1, responseTime: 856, avgResponse: 423, minResponse: 320, maxResponse: 890, env: 'pre-prod', account: 'ABC Corp', tz: 'Europe/London', httpCode: 200, downtimeReason: 'High response time', tags: ['staging'] },
      { name: 'Dspace_UAT', url: 'https://dspace-uat.example.com', status: 'down', uptime: 97.5, responseTime: 0, avgResponse: 267, minResponse: 210, maxResponse: 412, env: 'uat', account: 'DSpace Systems', tz: 'America/New_York', httpCode: 500, downtimeReason: 'Internal server error', tags: ['uat', 'dspace'] },
      { name: 'Dspace_Pre_Prod', url: 'https://dspace-preprod.example.com', status: 'up', uptime: 99.6, responseTime: 289, avgResponse: 295, minResponse: 240, maxResponse: 420, env: 'pre-prod', account: 'DSpace Systems', tz: 'UTC', httpCode: 200, tags: ['staging', 'dspace'] },
      { name: 'Dspace_Restapi', url: 'https://dspace-api.example.com/api', status: 'paused', uptime: 99.8, responseTime: 178, avgResponse: 185, minResponse: 145, maxResponse: 298, env: 'internal', account: 'DSpace Systems', tz: 'America/New_York', httpCode: 200, isPaused: true, tags: ['api', 'dspace'] },
      { name: 'Dspace_WebAPI_Prod', url: 'https://dspace-webapi.example.com', status: 'degraded', uptime: 99.2, responseTime: 654, avgResponse: 398, minResponse: 310, maxResponse: 720, env: 'production', account: 'DSpace Systems', tz: 'America/Chicago', httpCode: 200, downtimeReason: 'Slow response - CPU at 85%', tags: ['production', 'api'] },
      { name: 'Entrez_App_UAT', url: 'https://entrez-uat.example.com', status: 'up', uptime: 99.9, responseTime: 167, avgResponse: 172, minResponse: 140, maxResponse: 265, env: 'uat', account: 'Entrez Inc', tz: 'Asia/Kolkata', httpCode: 200, tags: ['uat', 'entrez'] },
    ];

    for (const m of monitors) {
      await db.query(
        `INSERT INTO monitors (id, name, url, type, status, uptime, uptime_today, response_time, avg_response_time, min_response_time, max_response_time, check_interval, timeout, environment, account_name, timezone, http_code, downtime_reason, is_paused, tags, organization_id)
         VALUES ($1,$2,$3,'https',$4,$5,100,$6,$7,$8,$9,60,30,$10,$11,$12,$13,$14,$15,$16,$17)`,
        [uuidv4(), m.name, m.url, m.status, m.uptime, m.responseTime, m.avgResponse, m.minResponse, m.maxResponse, m.env, m.account, m.tz, m.httpCode, m.downtimeReason || null, m.isPaused || false, m.tags, orgId]
      );
    }

    console.log('Seed complete!');
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exit(1);
  }
}

seed();
