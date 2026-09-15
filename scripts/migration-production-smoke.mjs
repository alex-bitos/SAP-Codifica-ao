import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { TARGET_APP, SOURCE_APP, proxy, connect, profile, secureDirectory } from './migration-database.mjs';
import { WEB_APP, targetConnection } from './migration-target.mjs';

const out = await secureDirectory(process.argv[2]);
assert(process.argv[3] === undefined || process.argv[3] === '--old-resources-deleted', 'Unrecognized smoke option.');
const oldResourcesDeleted = process.argv[3] === '--old-resources-deleted';
const tunnel = await proxy(TARGET_APP, 15532, true);
let client;
const temporarySessionIds = [];
const base = `https://${WEB_APP}.fly.dev`;
try {
  client = await connect(targetConnection('fly-db'), 15532);
  const tests = [];
  for (const route of ['/health', '/ready', '/']) assert.equal((await fetch(base + route)).status, 200);
  tests.push('HTTPS/frontend/health/readiness');
  if (!oldResourcesDeleted) {
    const old = await fetch(`https://${SOURCE_APP}.fly.dev/`, { redirect: 'manual' });
    assert.equal(old.status, 307);
    assert.equal(old.headers.get('location'), base + '/');
    assert.equal((await fetch(`https://${SOURCE_APP}.fly.dev/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })).status, 503);
    tests.push('Old URL redirects pages and rejects API writes before authentication');
  }
  await client.query('SET ROLE schema_admin');
  const before = await profile(client);
  const users = (await client.query('SELECT id,role FROM users WHERE active=true AND must_change_password=false ORDER BY role')).rows;
  for (const user of users) {
    const token = crypto.randomBytes(32).toString('base64url');
    const csrf = crypto.randomBytes(32).toString('base64url');
    const hashed = value => crypto.createHash('sha256').update(value).digest('hex');
    const inserted = (await client.query(`INSERT INTO sessions(token_hash,csrf_token_hash,user_id,expires_at,user_agent) VALUES ($1,$2,$3,now()+interval '5 minutes','Migration production smoke: temporary session') RETURNING id`, [hashed(token), hashed(csrf), user.id])).rows[0];
    temporarySessionIds.push(inserted.id);
    const headers = { Cookie: `sap_session=${token}` };
    const codes = await fetch(base + '/api/codes', { headers });
    assert.equal(codes.status, 200);
    assert.equal((await codes.json()).total, before.data['public.sap_codes'].rows);
    const status = await fetch(base + '/api/database/status', { headers });
    assert.equal(status.status, 200);
    const counts = (await status.json()).counts;
    assert.equal(counts.codes, 986); assert.equal(counts.categories, 147); assert.equal(counts.references, 610);
    const permissions = await fetch(base + '/api/users', { headers });
    assert.equal(permissions.status, user.role === 'Administrador' ? 200 : 403);
    tests.push(`Production catalog/query/permission: ${user.role}`);
  }
  assert(users.length > 0, 'No migrated user available for read-only production smoke.');
  for (const id of temporarySessionIds) await client.query("DELETE FROM sessions WHERE id=$1 AND user_agent='Migration production smoke: temporary session'", [id]);
  temporarySessionIds.length = 0;
  // Prove the new application role can start transactions without modifying rows.
  const app = await connect(targetConnection('fly-db', true), 15532);
  try { await app.query('BEGIN'); await app.query('UPDATE sap_codes SET sap_code=sap_code WHERE false'); await app.query('ROLLBACK'); }
  finally { await app.end(); }
  const after = await profile(client);
  assert.equal(after.sha256, before.sha256, 'Production smoke changed persisted data.');
  tests.push('Writable new application role; temporary smoke sessions removed; all original hashes/rows unchanged');
  const result = { observedAt: new Date().toISOString(), passed: true, base, targetApp: TARGET_APP, database: 'fly-db', dataHash: after.sha256, oldResourcesDeleted, tests, businessRowsChanged: false, originalUsersChanged: false, temporarySessionsRemaining: 0 };
  await fs.writeFile(path.join(out, 'production-smoke.json'), JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));
} finally {
  for (const id of temporarySessionIds) await client?.query("DELETE FROM sessions WHERE id=$1 AND user_agent='Migration production smoke: temporary session'", [id]);
  await client?.end(); tunnel.kill();
}
