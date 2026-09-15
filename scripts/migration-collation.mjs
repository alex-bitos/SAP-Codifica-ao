import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { sourceConnection, proxy, connect, SOURCE_CLUSTER, TARGET_APP, profile, secureDirectory } from './migration-database.mjs';
import { targetConnection, TEST_DB, RESTORE_VERIFY_DB } from './migration-target.mjs';

const out = await secureDirectory(process.argv[2]);
const metadataSql = `SELECT pg_encoding_to_char(encoding) AS encoding,datcollate,datctype,datlocprovider,daticulocale,datcollversion,pg_database_collation_actual_version(oid) AS actual_version FROM pg_database WHERE datname=current_database()`;
let source;
let tunnel = await proxy(SOURCE_CLUSTER, 15432);
let client;
try {
  client = await connect(sourceConnection(), 15432, false);
  source = (await client.query(metadataSql)).rows[0];
} finally { await client?.end(); tunnel.kill(); }
assert.equal(source.datcollversion, '2.41', 'Unexpected source collation: stop, do not alter automatically.');
const result = { generatedAt: new Date().toISOString(), source, targets: [], dataChanged: false };
tunnel = await proxy(TARGET_APP, 15532, true);
try {
  for (const database of ['fly-db', TEST_DB, RESTORE_VERIFY_DB, 'postgres', 'template1']) {
    client = await connect(targetConnection(database), 15532);
    const beforeMetadata = (await client.query(metadataSql)).rows[0];
    assert.equal(beforeMetadata.datcollate, source.datcollate);
    assert.equal(beforeMetadata.datctype, source.datctype);
    assert.equal(beforeMetadata.actual_version, source.actual_version, 'Image must match source libc before rebuilding.');
    let beforeProfile;
    if (['fly-db', TEST_DB, RESTORE_VERIFY_DB].includes(database)) {
      await client.query('SET ROLE schema_admin'); beforeProfile = await profile(client); await client.query('RESET ROLE');
    }
    if (beforeMetadata.datcollversion !== source.datcollversion) {
      // Rebuild indexes FIRST; refreshing only the version is not sufficient.
      await client.query(`REINDEX DATABASE "${database}"`);
      await client.query(`ALTER DATABASE "${database}" REFRESH COLLATION VERSION`);
    }
    const afterMetadata = (await client.query(metadataSql)).rows[0];
    assert.deepEqual(afterMetadata, source);
    if (beforeProfile) {
      await client.query('SET ROLE schema_admin');
      assert.equal((await profile(client)).sha256, beforeProfile.sha256, 'Reindex changed logical data/schema.');
    }
    result.targets.push({ database, metadata: afterMetadata, equal: true, dataHash: beforeProfile?.sha256 });
    await client.end(); client = undefined;
  }
  await fs.writeFile(path.join(out, 'collation-comparison.json'), JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));
} finally { await client?.end(); tunnel.kill(); }
