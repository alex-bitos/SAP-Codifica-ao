import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { transaction } from './db.js';

function migrationsDirectory() {
  const here = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(here, '../migrations');
}

export async function runMigrations() {
  const dir = migrationsDirectory();
  const files = (await fs.readdir(dir)).filter((name) => /^\d+.*\.sql$/.test(name)).sort();
  await transaction(async (client) => {
    await client.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
      version text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now()
    )`);
  });
  for (const file of files) {
    await transaction(async (client) => {
      const exists = await client.query('SELECT 1 FROM schema_migrations WHERE version = $1', [file]);
      if (exists.rowCount) return;
      const sql = await fs.readFile(path.join(dir, file), 'utf8');
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations(version) VALUES ($1)', [file]);
    });
  }
  return files;
}
