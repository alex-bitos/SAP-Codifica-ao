import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import pg from 'pg';
import * as XLSX from 'xlsx';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { getPool, setPoolForTests } from '../../src/db.js';
import { fieldDefinitions } from '../../src/domain/field-config.js';
import { runMigrations } from '../../src/migrate.js';
import { createBatch, createCode, previewCode } from '../../src/services/codes.js';
import { analyzeWorkbook, analyzeWorkbookAgainstDatabase, importWorkbook } from '../../src/services/importer.js';
import type { AuthUser, CodeInput } from '../../src/types.js';

const enabled = Boolean(process.env.TEST_DATABASE_URL);
const suite = enabled ? describe : describe.skip;
const schema = `review_${crypto.randomBytes(6).toString('hex')}`;
const workbookPath = path.resolve('Banco_de_Dados_Codigos_SAP_rev3_Consolidado_Flange_Cover.xlsx');
const workbookBuffer = fs.readFileSync(workbookPath);
let pool: pg.Pool;
let admin: AuthUser;
let coder: AuthUser;
let initialImport: Awaited<ReturnType<typeof importWorkbook>>;
let historicalDigest = '';

function databasePool() {
  return new pg.Pool({ connectionString: process.env.TEST_DATABASE_URL, options: `-c search_path=${schema}` });
}

async function digestHistoricalCodes() {
  const rows = await getPool().query(`SELECT sap_code,standardized_description FROM sap_codes
    WHERE source='Excel histórico' ORDER BY canonical_code`);
  return crypto.createHash('sha256').update(JSON.stringify(rows.rows)).digest('hex');
}

async function productInputs(suffix: string): Promise<{ name: string; base: string; input: CodeInput }[]> {
  const categories = await getPool().query(`SELECT c.id,c.name,c.base_code FROM categories c
    JOIN natures n ON n.id=c.nature_id WHERE n.name='Produto Acabado' AND c.active=true ORDER BY c.name`);
  const byName = new Map(categories.rows.map((row) => [row.name, row]));
  const item = (name: string, attributes: Record<string, string>) => ({
    name, base: byName.get(name)?.base_code || '', input: { categoryId: byName.get(name)?.id || '', attributes },
  });
  return [
    item('Chevron com Alojamento', { material: '316L', modulo: '35223184', modelo: `3.1130 ${suffix}` }),
    item('Coletor', { especificacao: `Coletor ${suffix}` }),
    item('Distribuidores', { especificacao: `Distribuidor ${suffix}` }),
    item('FiberBed', { tipo: 'BD', modelo: `SingleBed ${suffix}`, fixacao: 'SRF', material_grade: '316L', material_leito: 'FV', material_fixacoes: '316L' }),
    item('Flange Cover', suffix === 'individual'
      ? { modelo: 'EconoGard', material: 'PVC', diametro: '2"', classe: 'ANSI 150#', dreno: 'Sem dreno' }
      : { modelo: 'MetalGard', material: '316L', diametro: '4"', classe: 'ANSI 300#', dreno: 'Com dreno' }),
    item('Limitadores', { especificacao: `Limitador ${suffix}` }),
    item('MaxiMesh', { modelo: `326 ${suffix}`, geometria: 'Circular', material_malha: '304L', material_grade: '304L', espessura: '1,52', dimensao: '1500' }),
    item('MaxiPac', { modelo: `200X ${suffix}`, material: '316L', diametro: '1500' }),
    item('Recheio Randomico', { modelo: `CMTP ${suffix}`, dimensao: '25', material: '316L' }),
    item('Suporte', { especificacao: `Suporte ${suffix}` }),
    item('Vaso', { especificacao: `Vaso ${suffix}` }),
  ];
}

function failingWorkbook() {
  const workbook = XLSX.utils.book_new();
  const sheets = {
    Codigos: [{ CodigoSAP: 'PATZ0000000001', DescricaoPadronizada: 'Falha controlada', Natureza: 'Produto Acabado', Categoria: 'Categoria ausente' }],
    Categorias: [{ Natureza: 'Produto Acabado', Categoria: 'Categoria temporária', CodigoBase: 'PATZ', FormatoDescricao: 'Temporário <tipo>', CamposObrigatorios: 'tipo' }],
    Referencias: [{ Grupo: '', Descricao: '', Codigo: '', Situacao: '', Observacao: '' }],
    Historico: [{ DataHora: '', Usuario: '', Acao: '', CodigoSAP: '', ValorAnterior: '', ValorNovo: '', Observacao: '' }],
  };
  for (const [name, rows] of Object.entries(sheets)) XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rows), name);
  return Buffer.from(XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }));
}

suite('revisão integral PostgreSQL e Produtos Acabados', () => {
  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
    const bootstrap = new pg.Pool({ connectionString: process.env.TEST_DATABASE_URL });
    await bootstrap.query(`CREATE SCHEMA ${schema}`);
    await bootstrap.end();
    pool = databasePool();
    setPoolForTests(pool);
    await runMigrations();
    const users = await Promise.all([
      pool.query(`INSERT INTO users(name,login,password_hash,role,must_change_password) VALUES ('Revisão Admin','review_admin','hash','Administrador',false) RETURNING id`),
      pool.query(`INSERT INTO users(name,login,password_hash,role,must_change_password) VALUES ('Revisão Codificador','review_coder','hash','Codificador',false) RETURNING id`),
    ]);
    admin = { id: users[0].rows[0].id, name: 'Revisão Admin', login: 'review_admin', email: null, role: 'Administrador', mustChangePassword: false };
    coder = { id: users[1].rows[0].id, name: 'Revisão Codificador', login: 'review_coder', email: null, role: 'Codificador', mustChangePassword: false };
    const analysis = analyzeWorkbook(workbookBuffer, path.basename(workbookPath));
    initialImport = await importWorkbook(workbookBuffer, path.basename(workbookPath), analysis.fileHash, admin);
    historicalDigest = await digestHistoricalCodes();
  }, 120_000);

  afterAll(async () => {
    if (pool) await pool.end();
    const cleanup = new pg.Pool({ connectionString: process.env.TEST_DATABASE_URL });
    await cleanup.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
    await cleanup.end();
    setPoolForTests(undefined);
  });

  it('importa o Excel original uma única vez com todas as linhas esperadas', async () => {
    expect(initialImport).toMatchObject({ codes: 986, categories: 145, references: 604, history: 5, insertedCodes: 986 });
    const counts = (await pool.query(`SELECT
      (SELECT count(*)::int FROM natures) AS natures,
      (SELECT count(*)::int FROM categories) AS categories,
      (SELECT count(*)::int FROM technical_references WHERE active=true) AS references,
      (SELECT count(*)::int FROM sap_codes) AS codes,
      (SELECT count(*)::int FROM audit_log WHERE entity_type='legacy_history') AS history,
      (SELECT count(*)::int FROM database_imports WHERE status='COMPLETED') AS imports`)).rows[0];
    expect(counts).toEqual({ natures: 12, categories: 147, references: 574, codes: 986, history: 5, imports: 1 });
  });

  it('reimporta em modo de simulação com zero inclusões e bloqueia a confirmação sem alterar históricos', async () => {
    const analysis = analyzeWorkbook(workbookBuffer, path.basename(workbookPath));
    const preview = await analyzeWorkbookAgainstDatabase(workbookBuffer, path.basename(workbookPath));
    expect(preview.toInsert).toEqual({ codes: 0, categories: 0, references: 0, history: 0 });
    expect(preview.existing).toEqual({ codes: 986, categories: 147, references: 574, history: 5 });
    await expect(importWorkbook(workbookBuffer, path.basename(workbookPath), analysis.fileHash, admin)).rejects.toMatchObject({
      status: 409, code: 'IMPORT_ALREADY_COMPLETED', details: { rolledBack: true, dataWritten: false },
    });
    expect(await digestHistoricalCodes()).toBe(historicalDigest);
  });

  it('faz rollback integral quando a gravação falha depois do início da transação', async () => {
    const buffer = failingWorkbook();
    const analysis = analyzeWorkbook(buffer, 'falha-controlada.xlsx');
    const before = (await pool.query(`SELECT
      (SELECT count(*)::int FROM categories) AS categories,
      (SELECT count(*)::int FROM sap_codes) AS codes,
      (SELECT count(*)::int FROM database_imports) AS imports,
      (SELECT count(*)::int FROM audit_log) AS audits`)).rows[0];
    await expect(importWorkbook(buffer, 'falha-controlada.xlsx', analysis.fileHash, admin)).rejects.toMatchObject({
      status: 500, code: 'IMPORT_TRANSACTION_FAILED', details: { rolledBack: true, dataWritten: false },
    });
    const after = (await pool.query(`SELECT
      (SELECT count(*)::int FROM categories) AS categories,
      (SELECT count(*)::int FROM sap_codes) AS codes,
      (SELECT count(*)::int FROM database_imports) AS imports,
      (SELECT count(*)::int FROM audit_log) AS audits`)).rows[0];
    expect(after).toEqual(before);
  });

  it('mantém os dados depois de reiniciar todas as conexões do backend', async () => {
    const before = (await pool.query('SELECT count(*)::int AS total FROM sap_codes')).rows[0].total;
    await pool.end();
    pool = databasePool();
    setPoolForTests(pool);
    expect((await pool.query('SELECT count(*)::int AS total FROM sap_codes')).rows[0].total).toBe(before);
    expect((await pool.query('SELECT count(*)::int AS total FROM categories')).rows[0].total).toBe(147);
    expect((await pool.query('SELECT count(*)::int AS total FROM technical_references WHERE active=true')).rows[0].total).toBe(574);
  });

  it('apresenta os campos e gera individualmente todas as 11 categorias de Produto Acabado', async () => {
    const inputs = await productInputs('individual');
    expect(inputs.map((item) => item.name)).toEqual(['Chevron com Alojamento','Coletor','Distribuidores','FiberBed','Flange Cover','Limitadores','MaxiMesh','MaxiPac','Recheio Randomico','Suporte','Vaso']);
    const references = (await pool.query(`SELECT reference_group AS "group",description,code,active FROM technical_references WHERE active=true`)).rows;
    const results = [];
    for (const item of inputs) {
      const category = (await pool.query(`SELECT c.id,c.nature_id AS "natureId",n.name AS nature,n.code AS "natureCode",c.name,
        c.base_code AS "baseCode",c.description_format AS "descriptionFormat",c.characteristic_1 AS "characteristic1",
        c.characteristic_2 AS "characteristic2",c.code_formula AS "codeFormula",c.required_fields AS "requiredFields",c.example,c.active
        FROM categories c JOIN natures n ON n.id=c.nature_id WHERE c.id=$1`, [item.input.categoryId])).rows[0];
      const fields = fieldDefinitions(category, references);
      expect(fields.map((field) => field.key)).toEqual(Object.keys(item.input.attributes));
      const preview = await previewCode(item.input);
      const created = await createCode(item.input, admin);
      expect(preview.code.startsWith(item.base)).toBe(true);
      expect(created.sap_code).toHaveLength(14);
      expect(created.sap_code.startsWith(item.base)).toBe(true);
      expect(created.verification_digit).toBe('');
      if (item.name !== 'Flange Cover') expect(created.sequential).toMatch(/^\d{6}$/);
      expect(created.standardized_description).not.toMatch(/<[^>]+>/);
      results.push(created);
      await expect(createCode(item.input, coder)).rejects.toMatchObject({ status: 409 });
    }
    expect(results).toHaveLength(11);
    expect((await pool.query(`SELECT count(*)::int AS total FROM sap_codes WHERE source LIKE 'Aplicação%'`)).rows[0].total).toBe(11);
  });

  it('gera as 11 categorias em um único lote transacional e mantém a paridade histórica', async () => {
    const inputs = await productInputs('lote');
    const created = await createBatch(inputs.map((item) => item.input), coder);
    expect(created).toHaveLength(11);
    expect(new Set(created.map((row) => row.sap_code)).size).toBe(11);
    expect(created.every((row) => row.sap_code.length === 14 && row.verification_digit === '')).toBe(true);
    expect(await digestHistoricalCodes()).toBe(historicalDigest);
  });

  it('entrega a mesma base persistida aos dois usuários e após um segundo reinício', async () => {
    const seenByAdmin = (await pool.query('SELECT count(*)::int AS total FROM sap_codes')).rows[0].total;
    const seenByCoder = (await getPool().query('SELECT count(*)::int AS total FROM sap_codes')).rows[0].total;
    expect(seenByAdmin).toBe(1008);
    expect(seenByCoder).toBe(seenByAdmin);
    await pool.end();
    pool = databasePool();
    setPoolForTests(pool);
    expect((await pool.query('SELECT count(*)::int AS total FROM sap_codes')).rows[0].total).toBe(1008);
    expect(await digestHistoricalCodes()).toBe(historicalDigest);
  });
});
