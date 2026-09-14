import type { PoolClient } from 'pg';
import type { AuthUser } from './types.js';

export async function audit(client: PoolClient, action: string, entityType: string, entityId: string, user?: AuthUser, options: {
  before?: unknown; after?: unknown; details?: unknown; ip?: string;
} = {}) {
  await client.query(`INSERT INTO audit_log
    (user_id, actor_name, action, entity_type, entity_id, before_data, after_data, details, ip_address)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`, [
    user?.id || null, user?.name || 'Sistema', action, entityType, entityId,
    options.before ? JSON.stringify(options.before) : null,
    options.after ? JSON.stringify(options.after) : null,
    options.details ? JSON.stringify(options.details) : null,
    options.ip || null,
  ]);
}
