import crypto from 'node:crypto';
import pg from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createCode } from '../../src/services/codes.js';
import { runMigrations } from '../../src/migrate.js';
import { setPoolForTests } from '../../src/db.js';

const enabled = Boolean(process.env.TEST_DATABASE_URL);
const suite = enabled ? describe : describe.skip;
const schema = `test_${crypto.randomBytes(6).toString('hex')}`;
let admin: any; let categoryId = '';

suite('concorrência PostgreSQL real', () => {
  beforeAll(async () => {
    process.env.NODE_ENV = 'test'; process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
    const bootstrap = new pg.Pool({ connectionString: process.env.TEST_DATABASE_URL });
    await bootstrap.query(`CREATE SCHEMA ${schema}`); await bootstrap.end();
    const pool = new pg.Pool({ connectionString: process.env.TEST_DATABASE_URL, options: `-c search_path=${schema}` }); setPoolForTests(pool);
    await runMigrations();
    const user = await pool.query(`INSERT INTO users(name,login,password_hash,role,must_change_password) VALUES ('Teste','teste','hash','Administrador',false) RETURNING id,name,login,email,role,must_change_password`);
    admin = { id:user.rows[0].id,name:'Teste',login:'teste',email:null,role:'Administrador',mustChangePassword:false };
    const nature = await pool.query("SELECT id FROM natures WHERE code='OT'");
    const category = await pool.query(`INSERT INTO categories(nature_id,name,base_code,description_format,required_fields) VALUES ($1,'Teste Concorrência','OTTC','Item <tipo>','["tipo"]') RETURNING id`,[nature.rows[0].id]); categoryId=category.rows[0].id;
  }, 30_000);
  afterAll(async () => { const pool=(await import('../../src/db.js')).getPool(); await pool.end(); const cleanup=new pg.Pool({connectionString:process.env.TEST_DATABASE_URL});await cleanup.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);await cleanup.end();setPoolForTests(undefined); });

  it('20 usuários simultâneos recebem códigos únicos e sequenciais', async () => {
    const requests=Array.from({length:20},(_,i)=>createCode({categoryId,attributes:{tipo:`Item ${i}`}},admin));
    const results=await Promise.all(requests); const codes=results.map((row)=>row.sap_code);
    expect(new Set(codes).size).toBe(20); expect(codes.map((code)=>code.slice(8)).sort()).toEqual(Array.from({length:20},(_,i)=>String(i+1).padStart(6,'0')));
  });

  it('duas confirmações simultâneas do mesmo item gravam somente uma', async () => {
    const input={categoryId,attributes:{tipo:'Mesmo item'}}; const settled=await Promise.allSettled([createCode(input,admin),createCode(input,admin)]);
    expect(settled.filter((x)=>x.status==='fulfilled')).toHaveLength(1); expect(settled.filter((x)=>x.status==='rejected')).toHaveLength(1);
  });

  it('rejeita referência ausente sem persistir código, contador ou auditoria', async () => {
    const pool = (await import('../../src/db.js')).getPool();
    const nature = await pool.query("SELECT id FROM natures WHERE code='PA'");
    const category = await pool.query(`INSERT INTO categories(
      nature_id,name,base_code,description_format,characteristic_1,code_formula,required_fields
    ) VALUES ($1,'Produto sem Referência','PATX','Produto <tipo>','Tipo','Código Base + Tipo + Sequencial','["tipo"]') RETURNING id`, [nature.rows[0].id]);
    const before = await pool.query(`SELECT
      (SELECT count(*)::int FROM sap_codes) AS codes,
      (SELECT count(*)::int FROM sequential_counters) AS counters,
      (SELECT count(*)::int FROM audit_log) AS audits`);

    await expect(createCode({ categoryId: category.rows[0].id, attributes: { tipo: 'Inexistente' } }, admin)).rejects.toMatchObject({
      status: 422,
      code: 'REFERENCE_MISSING',
      details: { group: 'Tipo', description: 'Inexistente', rolledBack: true, dataWritten: false },
    });

    const after = await pool.query(`SELECT
      (SELECT count(*)::int FROM sap_codes) AS codes,
      (SELECT count(*)::int FROM sequential_counters) AS counters,
      (SELECT count(*)::int FROM audit_log) AS audits`);
    expect(after.rows[0]).toEqual(before.rows[0]);
  });
});
