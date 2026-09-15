import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { TARGET_APP, safeCommand } from './migration-database.mjs';
import { WEB_APP, importSecrets, targetConnection } from './migration-target.mjs';

// Bounded and idempotent: ONLY the two new SAP applications can be modified.
const query = args => JSON.parse(safeCommand('flyctl', args));
const names = rows => rows.map(row => row.Name || row.name);
for (const app of [TARGET_APP, WEB_APP]) {
  if (!names(query(['apps', 'list', '--json'])).includes(app)) safeCommand('flyctl', ['apps', 'create', app, '-o', 'personal']);
}
const secrets = names(query(['secrets', 'list', '-a', TARGET_APP, '--json']));
const required = ['POSTGRES_PASSWORD', 'SAP_APP_PASSWORD'];
assert(required.every(key => secrets.includes(key)) || required.every(key => !secrets.includes(key)), 'Partial existing credentials: stop; never rotate implicitly.');
if (!required.some(key => secrets.includes(key))) {
  safeCommand('flyctl', ['secrets', 'import', '-a', TARGET_APP, '--stage'], { input: required.map(key => `${key}=${crypto.randomBytes(36).toString('base64url')}`).join('\n') + '\n' });
}
let volumes = query(['volumes', 'list', '-a', TARGET_APP, '--json']);
if (!volumes.length) {
  safeCommand('flyctl', ['volumes', 'create', 'sap_pg_data', '-a', TARGET_APP, '-r', 'gru', '-s', '1', '-y', '--snapshot-retention', '7']);
  volumes = query(['volumes', 'list', '-a', TARGET_APP, '--json']);
}
assert.equal(volumes.length, 1, 'Never create another volume alongside an unexpected existing volume.');
assert.equal(volumes[0].name, 'sap_pg_data');
assert.equal(volumes[0].region, 'gru');
assert.equal(query(['ips', 'list', '-a', TARGET_APP, '--json']).length, 0, 'Database must not have public IPs.');
let databaseMachines = query(['machine', 'list', '-a', TARGET_APP, '--json']);
if (!databaseMachines.length) {
  console.log('Building/deploying a single private PostgreSQL Machine.');
  safeCommand('flyctl', ['deploy', '--config', 'infra/fly.postgres.toml', '--ha=false', '--yes']);
  databaseMachines = query(['machine', 'list', '-a', TARGET_APP, '--json']);
}
assert.equal(databaseMachines.length, 1);
assert.equal(databaseMachines[0].config.restart.policy, 'always');
assert.equal(databaseMachines[0].config.services?.length || 0, 0);
const ips = query(['ips', 'list', '-a', WEB_APP, '--json']);
if (!ips.some(ip => (ip.address || ip.Address || '').includes(':'))) safeCommand('flyctl', ['ips', 'allocate-v6', '-a', WEB_APP]);
if (!ips.some(ip => (ip.type || ip.Type) === 'shared')) safeCommand('flyctl', ['ips', 'allocate-v4', '--shared', '-a', WEB_APP]);
if (!names(query(['secrets', 'list', '-a', WEB_APP, '--json'])).includes('DATABASE_URL')) importSecrets(WEB_APP, { DATABASE_URL: targetConnection('fly-db', true).href });
if (!query(['machine', 'list', '-a', WEB_APP, '--json']).length) {
  console.log('Deploying a single web Machine; requires the restored production database.');
  safeCommand('flyctl', ['deploy', '--config', 'infra/fly.web-economico.toml', '--ha=false', '--yes']);
}
assert.equal(query(['machine', 'list', '-a', WEB_APP, '--json']).length, 1);
console.log('Independent infrastructure verified. Existing credentials/volumes preserved; reference and old apps untouched.');
