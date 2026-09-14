import type { PoolClient } from 'pg';
import { audit } from '../audit.js';
import { getPool, transaction } from '../db.js';
import type { AuthUser, Category, CodeInput } from '../types.js';
import { buildDescription, buildFlangeCover, composeSequentialCode, isFlangeCover, missingFields, normalizedTechnicalDescription, normalizeInput, structuralPrefix, technicalKey, validateCompatibility, valueForCharacteristic } from '../domain/code-rules.js';
import { canonicalGroup, normalizeText } from '../domain/normalization.js';

export class ConflictError extends Error { status = 409; }
export class ValidationError extends Error { status = 400; }

function mapCategory(row: any): Category {
  return {
    id: row.id, natureId: row.nature_id, nature: row.nature, natureCode: row.nature_code,
    name: row.name, baseCode: row.base_code, descriptionFormat: row.description_format,
    characteristic1: row.characteristic_1, characteristic2: row.characteristic_2,
    codeFormula: row.code_formula, requiredFields: row.required_fields || [], example: row.example,
    active: row.active,
  };
}

async function categoryById(client: PoolClient, id: string): Promise<Category> {
  const result = await client.query(`SELECT c.*, n.name AS nature, n.code AS nature_code
    FROM categories c JOIN natures n ON n.id=c.nature_id WHERE c.id=$1 AND c.active=true AND n.active=true`, [id]);
  if (!result.rows[0]) throw new ValidationError('Categoria ativa não encontrada.');
  return mapCategory(result.rows[0]);
}

async function referenceCode(client: PoolClient, group: string, value: string): Promise<string> {
  if (!group) return '';
  if (normalizeText(value) === 'na') return 'NA';
  const rows = await client.query(`SELECT reference_group, description, code FROM technical_references
    WHERE active=true AND code<>''`);
  const target = canonicalGroup(group);
  const match = rows.rows.find((row) => canonicalGroup(row.reference_group) === target && normalizeText(row.description) === normalizeText(value));
  return match?.code || '';
}

async function flangeOverrides(client: PoolClient) {
  const rows = await client.query(`SELECT reference_group, description, code FROM technical_references
    WHERE active=true AND reference_group LIKE 'Flange Cover:%'`);
  return Object.fromEntries(rows.rows.map((row) => [
    `${normalizeText(row.reference_group.split(':')[1])}:${normalizeText(row.description)}`, row.code,
  ]));
}

async function prepare(client: PoolClient, inputValue: CodeInput) {
  const input = normalizeInput(inputValue);
  const category = await categoryById(client, input.categoryId);
  const missing = missingFields(category, input.attributes);
  if (missing.length) throw new ValidationError(`Campos obrigatórios ausentes: ${missing.join(', ')}.`);
  const compatibility = validateCompatibility(category, input.attributes);
  if (compatibility) throw new ValidationError(compatibility);
  const description = input.description?.trim() || buildDescription(category, input.attributes);
  const key = technicalKey(category, input.attributes);
  const duplicate = await client.query(`SELECT id, sap_code FROM sap_codes
    WHERE nature_id=$1 AND technical_key=$2 AND status IN ('Ativo','Aprovado','Provisório') LIMIT 1`, [category.natureId, key]);
  if (duplicate.rows[0]) throw new ConflictError(`Item já cadastrado no código ${duplicate.rows[0].sap_code}.`);
  const legacyCandidates = await client.query(`SELECT sap_code,standardized_description FROM sap_codes
    WHERE nature_id=$1 AND category_id=$2 AND (technical_key IS NULL OR technical_key='')
      AND status IN ('Ativo','Aprovado','Provisório')`, [category.natureId, category.id]);
  const legacyDuplicate = legacyCandidates.rows.find((row) =>
    normalizedTechnicalDescription(row.standardized_description) === normalizedTechnicalDescription(description));
  if (legacyDuplicate) throw new ConflictError(`Item já cadastrado no código ${legacyDuplicate.sap_code}.`);
  if (isFlangeCover(category)) {
    const flange = buildFlangeCover(input.attributes, await flangeOverrides(client));
    return { input, category, description: flange.description, key, c1: flange.parts.modelo, c2: flange.parts.material, v1: input.attributes.modelo, v2: input.attributes.material, special: true, code: flange.code, prefix: '' };
  }
  const v1 = valueForCharacteristic(category.characteristic1, input.attributes);
  const v2 = valueForCharacteristic(category.characteristic2, input.attributes);
  const c1 = category.characteristic1 ? await referenceCode(client, category.characteristic1, v1) : '';
  const c2 = category.characteristic2 ? await referenceCode(client, category.characteristic2, v2) : '';
  if (category.characteristic1 && !c1) throw new ValidationError(`Referência não cadastrada para ${category.characteristic1}: ${v1}.`);
  if (category.characteristic2 && !c2) throw new ValidationError(`Referência não cadastrada para ${category.characteristic2}: ${v2}.`);
  const prefix = structuralPrefix(category, c1, c2);
  return { input, category, description, key, c1, c2, v1, v2, special: false, code: '', prefix };
}

export async function previewCode(input: CodeInput) {
  const client = await getPool().connect();
  try {
    const prepared = await prepare(client, input);
    if (prepared.special) return { code: prepared.code, estimated: false, description: prepared.description, technicalKey: prepared.key, verificationDigit: '' };
    const counter = await client.query('SELECT last_value FROM sequential_counters WHERE structural_prefix=$1', [prepared.prefix]);
    const estimated = Number(counter.rows[0]?.last_value || 0) + 1;
    return { code: composeSequentialCode(prepared.prefix, estimated), estimated: true, description: prepared.description, technicalKey: prepared.key, sequential: String(estimated).padStart(6, '0'), verificationDigit: '' };
  } finally { client.release(); }
}

async function generateInTransaction(client: PoolClient, input: CodeInput, user: AuthUser, ip?: string) {
  const prepared = await prepare(client, input);
  let code = prepared.code;
  let sequential = '';
  if (!prepared.special) {
    await client.query(`INSERT INTO sequential_counters(structural_prefix,last_value) VALUES ($1,0)
      ON CONFLICT (structural_prefix) DO NOTHING`, [prepared.prefix]);
    const counter = await client.query(`SELECT last_value FROM sequential_counters
      WHERE structural_prefix=$1 FOR UPDATE`, [prepared.prefix]);
    const next = Number(counter.rows[0].last_value) + 1;
    if (next > 999999) throw new ConflictError('Sequencial esgotado para este prefixo.');
    code = composeSequentialCode(prepared.prefix, next);
    sequential = String(next).padStart(6, '0');
    await client.query('UPDATE sequential_counters SET last_value=$2, updated_at=now() WHERE structural_prefix=$1', [prepared.prefix, next]);
  }
  const created = await client.query(`INSERT INTO sap_codes(
      sap_code, canonical_code, standardized_description, nature_id, nature_code, category_id, category_code,
      characteristic_1, characteristic_1_code, characteristic_2, characteristic_2_code, sequential,
      verification_digit, sequential_rule, technical_key, origin, unit, manufacturer, model, tag, ncp,
      project, serial_number, notes, status, source, technical_attributes, created_by, updated_by)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'',$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,'Provisório',$24,$25,$26,$26)
    RETURNING id, sap_code, standardized_description, sequential, verification_digit, status, created_at`, [
    code, code, prepared.description, prepared.category.natureId, prepared.category.natureCode, prepared.category.id,
    prepared.category.baseCode.slice(2), prepared.v1, prepared.c1, prepared.v2, prepared.c2, sequential,
    prepared.special ? 'Flange Cover - combinação fixa' : 'Novo - 6 dígitos; sem DV', prepared.key,
    prepared.input.origin || prepared.input.attributes.origem || '', prepared.input.unit || '', prepared.input.manufacturer || '',
    prepared.input.model || prepared.input.attributes.modelo || '', prepared.input.tag || '', prepared.input.ncp || '',
    prepared.input.project || '', prepared.input.serialNumber || '', prepared.input.notes || '',
    prepared.special ? 'Aplicação - Flange Cover' : 'Aplicação', JSON.stringify(prepared.input.attributes), user.id,
  ]);
  await audit(client, 'CODE_CREATED', 'sap_code', created.rows[0].id, user, { after: created.rows[0], ip });
  return created.rows[0];
}

function isRetryable(error: any) { return ['40001', '40P01'].includes(error?.code); }
function isUniqueConflict(error: any) { return error?.code === '23505'; }

export async function createCode(input: CodeInput, user: AuthUser, ip?: string) {
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      return await transaction(async (client) => {
        await client.query('SET TRANSACTION ISOLATION LEVEL SERIALIZABLE');
        return generateInTransaction(client, input, user, ip);
      });
    } catch (error) {
      if (isRetryable(error) && attempt < 3) continue;
      if (isUniqueConflict(error)) throw new ConflictError('Outro usuário confirmou este código primeiro. Atualize a consulta e tente novamente.');
      throw error;
    }
  }
  throw new ConflictError('Não foi possível reservar o sequencial após três tentativas.');
}

export async function createBatch(inputs: CodeInput[], user: AuthUser, ip?: string) {
  if (!inputs.length || inputs.length > 500) throw new ValidationError('O lote deve conter de 1 a 500 itens.');
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      return await transaction(async (client) => {
        await client.query('SET TRANSACTION ISOLATION LEVEL SERIALIZABLE');
        const results = [];
        for (const input of inputs) results.push(await generateInTransaction(client, input, user, ip));
        await audit(client, 'BATCH_CREATED', 'sap_code_batch', '', user, { details: { count: results.length }, ip });
        return results;
      });
    } catch (error) {
      if (isRetryable(error) && attempt < 3) continue;
      if (isUniqueConflict(error)) throw new ConflictError('Conflito com código ou item já confirmado por outro usuário. Nenhum item do lote foi gravado.');
      throw error;
    }
  }
  throw new ConflictError('Não foi possível confirmar o lote após três tentativas.');
}
