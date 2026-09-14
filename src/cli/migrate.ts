import { closePool } from '../db.js';
import { runMigrations } from '../migrate.js';

try {
  const migrations = await runMigrations();
  console.log(`${migrations.length} migração(ões) verificada(s).`);
} finally {
  await closePool();
}
