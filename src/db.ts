import pg, { type PoolClient, type QueryResultRow } from 'pg';
import { loadConfig } from './config.js';

const { Pool } = pg;
let pool: pg.Pool | undefined;

export function setPoolForTests(testPool: pg.Pool | undefined) {
  if (process.env.NODE_ENV !== 'test') throw new Error('A substituição do pool só é permitida em testes.');
  pool = testPool;
}

export function getPool(): pg.Pool {
  if (!pool) {
    const config = loadConfig();
    pool = new Pool({
      connectionString: config.DATABASE_URL,
      max: Number(process.env.PG_POOL_MAX || 10),
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
      ssl: config.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
    });
    pool.on('error', (error) => console.error('Falha no pool PostgreSQL:', error.message));
  }
  return pool;
}

export async function query<T extends QueryResultRow = QueryResultRow>(sql: string, values: unknown[] = []) {
  return getPool().query<T>(sql, values);
}

export async function transaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function closePool() {
  await pool?.end();
  pool = undefined;
}
