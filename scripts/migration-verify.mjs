import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { SOURCE_APP, SOURCE_CLUSTER, TARGET_APP, sourceConnection, proxy, connect, profile, secureDirectory } from './migration-database.mjs';
import { WEB_APP, targetConnection } from './migration-target.mjs';

export function runtimeDatabase(app) {
  assert([SOURCE_APP, WEB_APP].includes(app));
  const code = `import pg from "pg"; const u=new URL(process.env.DATABASE_URL); const c=new pg.Client({connectionString:u.href,ssl:{rejectUnauthorized:false}}); await c.connect(); const r=(await c.query("SELECT current_database() AS database,current_user,inet_server_addr()::text AS server,(SELECT count(*)::int FROM sap_codes) AS codes,(SELECT count(*)::int FROM users) AS users")).rows[0]; console.log(JSON.stringify({host:u.hostname,...r})); await c.end();`;
  const result = spawnSync('flyctl', ['ssh', 'console', '-a', app, '-C', `node --input-type=module -e '${code}'`], { encoding: 'utf8', windowsHide: true });
  const line = result.stdout?.split(/\r?\n/).find(line => line.startsWith('{"host":'));
  assert(line, 'Runtime verification failed. Raw output withheld.');
  const metadata = JSON.parse(line);
  console.log(JSON.stringify({ app, ...metadata }));
  return metadata;
}

async function live(directory) {
  const out = await secureDirectory(directory);
  const expected = JSON.parse(await fs.readFile(path.join(out, 'profile.json'), 'utf8'));
  for (const [app, url, port, ssl, unmanaged] of [[SOURCE_CLUSTER, sourceConnection(), 15432, false, false], [TARGET_APP, targetConnection('fly-db'), 15532, true, true]]) {
    const tunnel = await proxy(app, port, unmanaged);
    let client;
    try {
      client = await connect(url, port, ssl);
      if (unmanaged) await client.query('SET ROLE schema_admin');
      await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
      const actual = await profile(client);
      await client.query('COMMIT');
      assert.equal(actual.sha256, expected.sha256, `${app} differs from final snapshot. No cutover is permitted.`);
      console.log(JSON.stringify({ app, profileHash: actual.sha256, fullMatch: true, differences: [] }));
    } finally { await client?.end(); tunnel.kill(); }
  }
  await fs.writeFile(path.join(out, 'live-comparison.json'), JSON.stringify({ generatedAt: new Date().toISOString(), sourceCluster: SOURCE_CLUSTER, targetApp: TARGET_APP, hash: expected.sha256, fullMatch: true, businessMatch: true, differences: [] }, null, 2));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [command, arg] = process.argv.slice(2);
  if (command === 'live') await live(arg);
  else if (command === 'runtime') runtimeDatabase(arg);
  else throw new Error('Usage: migration-verify.mjs live BACKUP_DIRECTORY | runtime WEB_APP');
}
