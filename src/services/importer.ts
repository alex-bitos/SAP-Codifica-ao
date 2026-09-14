import crypto from 'node:crypto';
import * as XLSX from 'xlsx';
import type { PoolClient } from 'pg';
import { audit } from '../audit.js';
import { canonicalCode, normalizeText } from '../domain/normalization.js';
import { v311CategoryRows } from '../domain/v311-category-rules.js';
import { v311ReferenceIdentityGroup, v311ReferenceRows } from '../domain/v311-reference-rules.js';
import { getPool, transaction } from '../db.js';
import type { AuthUser } from '../types.js';

const REQUIRED_HEADERS = {
  Codigos: ['CodigoSAP', 'DescricaoPadronizada', 'Natureza', 'Categoria'],
  Categorias: ['Natureza', 'Categoria', 'CodigoBase', 'FormatoDescricao', 'CamposObrigatorios'],
  Referencias: ['Grupo', 'Descricao', 'Codigo', 'Situacao', 'Observacao'],
  Historico: ['DataHora', 'Usuario', 'Acao', 'CodigoSAP', 'ValorAnterior', 'ValorNovo', 'Observacao'],
} as const;

type WorkbookRows = Record<keyof typeof REQUIRED_HEADERS, Record<string, unknown>[]>;
export interface ImportAnalysis {
  fileName: string;
  fileHash: string;
  sheetNames: string[];
  counts: { codes: number; categories: number; references: number; history: number };
  canonicalDuplicates: { canonicalCode: string; rows: number[] }[];
  technicalDuplicates: { key: string; rows: number[] }[];
  referenceDuplicates: { key: string; rows: number[] }[];
  inconsistencies: string[];
  warnings: string[];
  valid: boolean;
}

function parse(buffer: Buffer): WorkbookRows {
  const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
  const result = {} as WorkbookRows;
  for (const [sheet, headers] of Object.entries(REQUIRED_HEADERS) as [keyof typeof REQUIRED_HEADERS, readonly string[]][]) {
    const worksheet = workbook.Sheets[sheet];
    if (!worksheet) throw new Error(`Aba obrigatória ausente: ${sheet}.`);
    const matrix = XLSX.utils.sheet_to_json<unknown[]>(worksheet, { header: 1, defval: '', raw: false });
    const actual = (matrix[0] || []).map(String);
    const missing = headers.filter((header) => !actual.includes(header));
    if (missing.length) throw new Error(`Aba ${sheet}: colunas ausentes: ${missing.join(', ')}.`);
    result[sheet] = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, { defval: '', raw: false });
  }
  return result;
}

function duplicates(values: { key: string; row: number }[]) {
  const grouped = new Map<string, number[]>();
  for (const item of values) {
    if (!item.key) continue;
    const rows = grouped.get(item.key) || [];
    rows.push(item.row);
    grouped.set(item.key, rows);
  }
  return [...grouped].filter(([, rows]) => rows.length > 1);
}

export function analyzeWorkbook(buffer: Buffer, fileName: string): ImportAnalysis & { rows: WorkbookRows } {
  const rows = parse(buffer);
  const canonicalDuplicates = duplicates(rows.Codigos.map((row, index) => ({ key: canonicalCode(row.CodigoSAP), row: index + 2 })))
    .map(([value, lineRows]) => ({ canonicalCode: value, rows: lineRows }));
  const technicalDuplicates = duplicates(rows.Codigos.map((row, index) => ({
    key: String(row.ChaveTecnica || '').trim(), row: index + 2,
  }))).map(([key, lineRows]) => ({ key, rows: lineRows }));
  const referenceDuplicates = duplicates(rows.Referencias.map((row, index) => ({
    key: `${v311ReferenceIdentityGroup(String(row.Grupo || ''))}|${normalizeText(row.Descricao)}`, row: index + 2,
  }))).map(([key, lineRows]) => ({ key, rows: lineRows }));
  const warnings: string[] = [];
  const inconsistencies: string[] = [];
  const populatedDv = rows.Codigos.filter((row) => String(row.DigitoVerificador || '').trim()).length;
  if (populatedDv) warnings.push(`${populatedDv} dígito(s) verificador(es) histórico(s) serão armazenados vazios, sem alterar o Código SAP.`);
  const legacy = rows.Codigos.filter((row) => canonicalCode(row.CodigoSAP).length !== 14).length;
  if (legacy) warnings.push(`${legacy} código(s) legado(s) serão preservados exatamente.`);
  return {
    fileName, fileHash: crypto.createHash('sha256').update(buffer).digest('hex'), sheetNames: Object.keys(REQUIRED_HEADERS), rows,
    counts: { codes: rows.Codigos.length, categories: rows.Categorias.length, references: rows.Referencias.length, history: rows.Historico.length },
    canonicalDuplicates, technicalDuplicates, referenceDuplicates, inconsistencies, warnings,
    valid: canonicalDuplicates.length === 0 && technicalDuplicates.length === 0,
  };
}

export async function analyzeWorkbookAgainstDatabase(buffer: Buffer, fileName: string) {
  const analysis = analyzeWorkbook(buffer, fileName);
  const [codeRows, categoryRows, referenceRows, importRows] = await Promise.all([
    getPool().query('SELECT canonical_code FROM sap_codes'),
    getPool().query(`SELECT n.name AS nature,c.name,c.base_code FROM categories c JOIN natures n ON n.id=c.nature_id`),
    getPool().query('SELECT reference_group,description FROM technical_references'),
    getPool().query('SELECT status FROM database_imports WHERE file_hash=$1', [analysis.fileHash]),
  ]);
  const existingCodes = new Set(codeRows.rows.map((row) => row.canonical_code));
  const effectiveCategories = v311CategoryRows(analysis.rows.Categorias);
  const existingCategories = new Set(categoryRows.rows.map((row) => `${normalizeText(row.nature)}|${normalizeText(row.name)}`));
  const effectiveReferences = v311ReferenceRows(analysis.rows.Referencias);
  const existingReferences = new Set(referenceRows.rows.map((row) => `${v311ReferenceIdentityGroup(row.reference_group)}|${normalizeText(row.description)}`));
  const existing = {
    codes: analysis.rows.Codigos.filter((row) => existingCodes.has(canonicalCode(row.CodigoSAP))).length,
    categories: effectiveCategories.filter((row) => existingCategories.has(`${normalizeText(row.Natureza)}|${normalizeText(row.Categoria)}`)).length,
    references: effectiveReferences.filter((row) => existingReferences.has(`${v311ReferenceIdentityGroup(String(row.Grupo || ''))}|${normalizeText(row.Descricao)}`)).length,
    history: importRows.rows[0]?.status === 'COMPLETED' ? analysis.counts.history : 0,
  };
  const toInsert = {
    codes: analysis.counts.codes - existing.codes,
    categories: effectiveCategories.length - existing.categories,
    references: effectiveReferences.length - existing.references,
    history: analysis.counts.history - existing.history,
  };
  const blocked = {
    codes: new Set([...analysis.canonicalDuplicates.flatMap((item) => item.rows), ...analysis.technicalDuplicates.flatMap((item) => item.rows)]).size,
    categories: 0, references: 0, history: 0,
  };
  const inconsistencies = [...analysis.inconsistencies];
  if (analysis.canonicalDuplicates.length) inconsistencies.push(`${analysis.canonicalDuplicates.length} conflito(s) de código canônico.`);
  if (analysis.technicalDuplicates.length) inconsistencies.push(`${analysis.technicalDuplicates.length} conflito(s) de chave técnica.`);
  if (analysis.referenceDuplicates.length) analysis.warnings.push(`${analysis.referenceDuplicates.length} duplicidade(s) semântica(s) de referência serão mescladas.`);
  if (importRows.rows[0]) inconsistencies.push(`Arquivo já registrado com situação ${importRows.rows[0].status}.`);
  const { rows: _rows, ...publicAnalysis } = analysis;
  return { ...publicAnalysis, effectiveCounts: { ...analysis.counts, categories: effectiveCategories.length, references: effectiveReferences.length }, existing, toInsert, blocked, inconsistencies };
}

const value = (row: Record<string, unknown>, key: string) => String(row[key] ?? '').trim();
const active = (raw: string) => normalizeText(raw) !== 'inativo';

export function importedSequential(rawValue: unknown, canonical: string) {
  const raw = String(rawValue ?? '').trim();
  if (raw) return /^\d{6}$/.test(raw) ? raw : '';
  return canonical.length === 14 && /^\d{6}$/.test(canonical.slice(8)) ? canonical.slice(8) : '';
}

export function categoryRowsForImport(rows: Record<string, unknown>[]) {
  return v311CategoryRows(rows);
}

async function natureId(client: PoolClient, name: string, code = '') {
  const found = await client.query('SELECT id, code FROM natures WHERE lower(name)=lower($1) OR code=$2 LIMIT 1', [name, code]);
  if (found.rows[0]) return found.rows[0];
  const inserted = await client.query('INSERT INTO natures(name,code) VALUES ($1,$2) RETURNING id,code', [name, code || 'OT']);
  return inserted.rows[0];
}

export async function importWorkbook(buffer: Buffer, fileName: string, expectedHash: string, user: AuthUser, ip?: string) {
  const analysis = analyzeWorkbook(buffer, fileName);
  if (analysis.fileHash !== expectedHash) throw new Error('O arquivo enviado não corresponde à simulação aprovada.');
  if (!analysis.valid) throw new Error('A importação contém conflitos críticos e foi cancelada.');
  return transaction(async (client) => {
    const previous = await client.query('SELECT id, status FROM database_imports WHERE file_hash=$1', [analysis.fileHash]);
    if (previous.rows[0]) throw new Error('Este arquivo já foi importado; operação idempotente bloqueada.');
    const importRow = await client.query(`INSERT INTO database_imports(file_name,file_hash,status,summary,imported_by)
      VALUES ($1,$2,'PROCESSING',$3,$4) RETURNING id`, [fileName, analysis.fileHash, JSON.stringify(analysis.counts), user.id]);

    const categoryIds = new Map<string, string>();
    const categoryRows = categoryRowsForImport(analysis.rows.Categorias);
    for (const row of categoryRows) {
      const nature = await natureId(client, value(row, 'Natureza'), value(row, 'CodigoBase').slice(0, 2).toUpperCase());
      const fields = value(row, 'CamposObrigatorios').split(';').map((item) => item.trim()).filter(Boolean);
      const result = await client.query(`INSERT INTO categories(nature_id,name,base_code,description_format,characteristic_1,characteristic_2,code_formula,required_fields,example,active)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
        ON CONFLICT (base_code) DO UPDATE SET nature_id=EXCLUDED.nature_id,name=EXCLUDED.name,
          description_format=EXCLUDED.description_format,characteristic_1=EXCLUDED.characteristic_1,
          characteristic_2=EXCLUDED.characteristic_2,code_formula=EXCLUDED.code_formula,
          required_fields=EXCLUDED.required_fields,example=EXCLUDED.example,active=EXCLUDED.active,updated_at=now()
        RETURNING id`, [nature.id, value(row, 'Categoria'), value(row, 'CodigoBase').toUpperCase(), value(row, 'FormatoDescricao'),
        value(row, 'Caracteristica1'), value(row, 'Caracteristica2'), value(row, 'FormulaCodigo'), JSON.stringify(fields), value(row, 'Exemplo'), active(value(row, 'Situacao'))]);
      categoryIds.set(`${normalizeText(value(row, 'Natureza'))}|${normalizeText(value(row, 'Categoria'))}`, result.rows[0].id);
    }

    for (const row of v311ReferenceRows(analysis.rows.Referencias)) {
      if (!value(row, 'Grupo') || !value(row, 'Descricao')) continue;
      await client.query(`INSERT INTO technical_references(reference_group,description,code,active,notes)
        VALUES ($1,$2,$3,$4,$5)
        ON CONFLICT (reference_group,description) DO UPDATE SET code=EXCLUDED.code,active=EXCLUDED.active,notes=EXCLUDED.notes,updated_at=now()`,
      [value(row, 'Grupo'), value(row, 'Descricao'), value(row, 'Codigo').toUpperCase(), active(value(row, 'Situacao')), value(row, 'Observacao')]);
    }

    let insertedCodes = 0;
    for (const row of analysis.rows.Codigos) {
      const exactCode = value(row, 'CodigoSAP');
      const canonical = canonicalCode(exactCode);
      const natureName = value(row, 'Natureza');
      const categoryName = value(row, 'Categoria');
      const nature = await natureId(client, natureName, value(row, 'CodigoNatureza').toUpperCase() || canonical.slice(0, 2));
      let categoryId = categoryIds.get(`${normalizeText(natureName)}|${normalizeText(categoryName)}`);
      if (!categoryId) {
        const category = await client.query(`SELECT c.id FROM categories c JOIN natures n ON n.id=c.nature_id
          WHERE lower(c.name)=lower($1) AND n.id=$2 LIMIT 1`, [categoryName, nature.id]);
        categoryId = category.rows[0]?.id;
      }
      if (!categoryId) throw new Error(`Categoria não localizada para o código ${exactCode}: ${natureName} / ${categoryName}.`);
      const storedSequential = importedSequential(row.Sequencial, canonical);
      await client.query(`INSERT INTO sap_codes(sap_code,canonical_code,standardized_description,nature_id,nature_code,category_id,category_code,
        characteristic_1,characteristic_1_code,characteristic_2,characteristic_2_code,sequential,verification_digit,sequential_rule,
        technical_key,origin,unit,manufacturer,model,tag,ncp,project,serial_number,notes,status,source,created_at,technical_attributes)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'',$13,NULL,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,'Excel histórico',$24,'{}')`, [
        exactCode, canonical, value(row, 'DescricaoPadronizada'), nature.id, value(row, 'CodigoNatureza') || nature.code,
        categoryId, value(row, 'CodigoCategoria'), value(row, 'Caracteristica1'), value(row, 'CodigoCaracteristica1'),
        value(row, 'Caracteristica2'), value(row, 'CodigoCaracteristica2'), storedSequential,
        value(row, 'RegraSequencial'), value(row, 'Origem'), value(row, 'Unidade'), value(row, 'Fabricante'), value(row, 'Modelo'),
        value(row, 'TAG'), value(row, 'NCPProjeto'), value(row, 'Projeto'), value(row, 'NumeroSerie'), value(row, 'Observacao'),
        value(row, 'Situacao') || 'Ativo', value(row, 'DataCriacao') || new Date().toISOString(),
      ]);
      insertedCodes += 1;
      if (canonical.length === 14 && /^\d{6}$/.test(canonical.slice(8))) {
        await client.query(`INSERT INTO sequential_counters(structural_prefix,last_value) VALUES ($1,$2)
          ON CONFLICT (structural_prefix) DO UPDATE SET last_value=GREATEST(sequential_counters.last_value,EXCLUDED.last_value),updated_at=now()`,
        [canonical.slice(0, 8), Number(canonical.slice(8))]);
      }
    }

    for (const row of analysis.rows.Historico) {
      await client.query(`INSERT INTO audit_log(actor_name,action,entity_type,entity_id,before_data,after_data,details,created_at)
        VALUES ($1,$2,'legacy_history',$3,$4,$5,$6,$7)`, [value(row, 'Usuario') || 'Sistema', value(row, 'Acao'), value(row, 'CodigoSAP'),
        JSON.stringify({ value: value(row, 'ValorAnterior') }), JSON.stringify({ value: value(row, 'ValorNovo') }),
        JSON.stringify({ observation: value(row, 'Observacao') }), value(row, 'DataHora') || new Date().toISOString()]);
    }
    await client.query(`UPDATE database_imports SET status='COMPLETED',completed_at=now(),summary=$2 WHERE id=$1`, [importRow.rows[0].id, JSON.stringify({ ...analysis.counts, insertedCodes, warnings: analysis.warnings })]);
    await audit(client, 'DATABASE_IMPORTED', 'database_import', importRow.rows[0].id, user, { details: analysis.counts, ip });
    return { importId: importRow.rows[0].id, ...analysis.counts, insertedCodes, warnings: analysis.warnings };
  });
}
