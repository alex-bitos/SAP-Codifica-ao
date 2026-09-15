import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { backup, secureDirectory, TARGET_APP } from './migration-database.mjs';
import { targetConnection } from './migration-target.mjs';

process.chdir(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'));
const root = await secureDirectory(path.join(process.env.LOCALAPPDATA, 'SAP-Codigos-Backups', 'daily'));
process.env.PG_BIN_DIR ||= path.join(process.env.LOCALAPPDATA, 'SAP-Codigos-Migration-Tools', 'postgres16', 'pgsql', 'bin');
const day = new Date().toISOString().slice(0, 10);
const log = path.join(root, `job-${day}.json`);
try {
  await backup(path.join(root, day), { url: targetConnection('fly-db'), cluster: TARGET_APP, port: 15532, ssl: true, unmanaged: true, app: TARGET_APP, role: 'schema_admin' });
  await fs.writeFile(log, JSON.stringify({ finishedAt: new Date().toISOString(), status: 'success', app: TARGET_APP, database: 'fly-db', directory: path.join(root, day) }, null, 2));
} catch {
  await fs.writeFile(log, JSON.stringify({ finishedAt: new Date().toISOString(), status: 'failed', app: TARGET_APP, error: 'Backup failed; raw errors suppressed to protect credentials. Inspect connectivity and backup hashes.' }, null, 2));
  process.exitCode = 1;
}
