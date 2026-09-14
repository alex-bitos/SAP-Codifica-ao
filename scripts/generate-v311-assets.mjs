import fs from 'node:fs/promises';
import path from 'node:path';
import * as XLSX from 'xlsx';
import { v311CategoryRows } from '../dist/domain/v311-category-rules.js';
import { v311ReferenceRows } from '../dist/domain/v311-reference-rules.js';
import { normalizeText } from '../dist/domain/normalization.js';
import { canonicalReferenceGroup } from '../dist/domain/field-config.js';

const root = path.resolve(import.meta.dirname, '..');
const htmlPath = path.join(root, 'Gerador_e_Controle_de_Codigos_SAP_V3_11_Tubo_Produto_Intermediario.html');
const workbookPath = path.join(root, 'Banco_de_Dados_Codigos_SAP_rev3_Consolidado_Flange_Cover.xlsx');

function extractObject(source, marker) {
  const start = source.indexOf(marker);
  if (start < 0) throw new Error(`Marcador não encontrado: ${marker}`);
  const brace = source.indexOf('{', start);
  let depth = 0; let quote = ''; let escaped = false;
  for (let index = brace; index < source.length; index += 1) {
    const char = source[index];
    if (quote) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === quote) quote = '';
      continue;
    }
    if (char === '"' || char === "'") { quote = char; continue; }
    if (char === '{') depth += 1;
    if (char === '}' && --depth === 0) return source.slice(brace, index + 1);
  }
  throw new Error(`Objeto incompleto: ${marker}`);
}

const rowText = (row, key) => String(row?.[key] ?? '').trim();
const categoryKey = (row) => `${normalizeText(rowText(row, 'Natureza'))}|${normalizeText(rowText(row, 'Categoria'))}`;
const referenceKey = (row) => `${canonicalReferenceGroup(rowText(row, 'Grupo'))}|${normalizeText(rowText(row, 'Descricao'))}`;
const categoryFields = ['Natureza', 'Categoria', 'CodigoBase', 'FormatoDescricao', 'Caracteristica1', 'Caracteristica2', 'FormulaCodigo', 'CamposObrigatorios', 'Exemplo', 'Situacao'];
const sql = (value) => `'${String(value ?? '').replaceAll("'", "''")}'`;

const html = await fs.readFile(htmlPath, 'utf8');
const defaultData = JSON.parse(extractObject(html, 'const DEFAULT_DATA='));
const workbook = XLSX.read(await fs.readFile(workbookPath), { type: 'buffer', cellDates: true });
const sheetRows = Object.fromEntries(['Codigos', 'Categorias', 'Referencias', 'Historico'].map((name) => [name,
  XLSX.utils.sheet_to_json(workbook.Sheets[name], { defval: '', raw: false })]));

const mergedCategories = defaultData.categories.map((row) => ({ ...row }));
const positions = new Map(mergedCategories.map((row, index) => [categoryKey(row), index]));
for (const row of sheetRows.Categorias) {
  const key = categoryKey(row); const position = positions.get(key);
  if (position === undefined) { positions.set(key, mergedCategories.length); mergedCategories.push({ ...row }); }
  else mergedCategories[position] = { ...mergedCategories[position], ...row };
}
const sourceCategories = v311CategoryRows(mergedCategories);
const webCategories = v311CategoryRows(sheetRows.Categorias);
const sourceReferences = v311ReferenceRows([...defaultData.references, ...sheetRows.Referencias]);
const webReferences = v311ReferenceRows(sheetRows.Referencias);

const sourceCategoryMap = new Map(sourceCategories.map((row) => [categoryKey(row), row]));
const webCategoryMap = new Map(webCategories.map((row) => [categoryKey(row), row]));
const allCategoryKeys = [...new Set([...sourceCategoryMap.keys(), ...webCategoryMap.keys()])].sort();
const categoryComparison = allCategoryKeys.map((key) => {
  const expected = sourceCategoryMap.get(key); const actual = webCategoryMap.get(key);
  const differences = expected && actual ? categoryFields.filter((field) => rowText(expected, field) !== rowText(actual, field)) : [];
  return { key, expected, actual, differences, status: !expected ? 'Somente multiusuário' : !actual ? 'Ausente' : differences.length ? 'Divergente' : 'Equivalente' };
});

const sourceReferenceMap = new Map(sourceReferences.map((row) => [referenceKey(row), row]));
const webReferenceMap = new Map(webReferences.map((row) => [referenceKey(row), row]));
const allReferenceKeys = [...new Set([...sourceReferenceMap.keys(), ...webReferenceMap.keys()])].sort();
const referenceComparison = allReferenceKeys.map((key) => {
  const expected = sourceReferenceMap.get(key); const actual = webReferenceMap.get(key);
  const differences = expected && actual ? ['Grupo', 'Descricao', 'Codigo', 'Situacao'].filter((field) => rowText(expected, field) !== rowText(actual, field)) : [];
  return { key, expected, actual, differences, status: !expected ? 'Somente multiusuário' : !actual ? 'Ausente' : differences.length ? 'Divergente' : 'Equivalente' };
});

await fs.mkdir(path.join(root, 'seeds'), { recursive: true });
await fs.writeFile(path.join(root, 'seeds', 'v311-complete.json'), `${JSON.stringify({
  generatedFrom: { html: path.basename(htmlPath), workbook: path.basename(workbookPath) },
  sheets: { ...sheetRows, Categorias: webCategories, Referencias: webReferences },
}, null, 2)}\n`, 'utf8');

const categoryReport = [
  '# Relação de categorias V3.11 × multiusuário', '',
  'Gerado automaticamente em 14/09/2026 a partir do HTML V3.11 e da planilha consolidada.', '',
  `- V3.11 embutida: ${defaultData.categories.length} categorias.`, `- Planilha: ${sheetRows.Categorias.length} categorias.`,
  `- Catálogo efetivo esperado: ${sourceCategories.length} categorias.`, `- Catálogo gerado para o PostgreSQL: ${webCategories.length} categorias.`,
  `- Equivalentes: ${categoryComparison.filter((row) => row.status === 'Equivalente').length}.`, `- Divergências: ${categoryComparison.filter((row) => row.status !== 'Equivalente').length}.`, '',
  '| Natureza | Categoria | Base | Campos (ordem oficial) | Situação | Comparação |', '| --- | --- | --- | --- | --- | --- |',
  ...categoryComparison.map(({ expected, actual, status, differences }) => { const row = expected || actual; return `| ${rowText(row, 'Natureza')} | ${rowText(row, 'Categoria')} | ${rowText(row, 'CodigoBase')} | ${rowText(row, 'CamposObrigatorios')} | ${rowText(row, 'Situacao')} | ${status}${differences.length ? `: ${differences.join(', ')}` : ''} |`; }), '',
];
await fs.writeFile(path.join(root, 'docs', 'PARIDADE_CATEGORIAS_V311.md'), categoryReport.join('\n'), 'utf8');

const referenceReport = [
  '# Relação de referências V3.11 × multiusuário', '',
  `Gerado automaticamente em 14/09/2026. Linhas originais: ${sheetRows.Referencias.length}; referências efetivas esperadas: ${sourceReferences.length}; referências efetivas para o PostgreSQL: ${webReferences.length}.`, '',
  '| Grupo | Descrição | Código | Situação | Comparação |', '| --- | --- | --- | --- | --- |',
  ...referenceComparison.map(({ expected, actual, status, differences }) => { const row = expected || actual; return `| ${rowText(row, 'Grupo')} | ${rowText(row, 'Descricao')} | ${rowText(row, 'Codigo')} | ${rowText(row, 'Situacao')} | ${status}${differences.length ? `: ${differences.join(', ')}` : ''} |`; }), '',
];
await fs.writeFile(path.join(root, 'docs', 'PARIDADE_REFERENCIAS_V311.md'), referenceReport.join('\n'), 'utf8');

const updateStatements = webCategories.map((row) => `UPDATE categories SET
  nature_id=(SELECT id FROM natures WHERE name=${sql(rowText(row, 'Natureza'))}),
  name=${sql(rowText(row, 'Categoria'))}, base_code=${sql(rowText(row, 'CodigoBase').toUpperCase())},
  description_format=${sql(rowText(row, 'FormatoDescricao'))}, characteristic_1=${sql(rowText(row, 'Caracteristica1'))},
  characteristic_2=${sql(rowText(row, 'Caracteristica2'))}, code_formula=${sql(rowText(row, 'FormulaCodigo'))},
  required_fields=${sql(JSON.stringify(rowText(row, 'CamposObrigatorios').split(';').map((item) => item.trim()).filter(Boolean)))}::jsonb,
  example=${sql(rowText(row, 'Exemplo'))}, active=${normalizeText(rowText(row, 'Situacao')) === 'inativo' ? 'false' : 'true'}, updated_at=now()
WHERE base_code=${sql(rowText(row, 'CodigoBase').toUpperCase())};`);
await fs.writeFile(path.join(root, 'migrations', '002_v311_category_parity.sql'), ['-- Gerado por scripts/generate-v311-assets.mjs. Não altera códigos históricos.', ...updateStatements].join('\n\n'), 'utf8');

const summary = {
  source: { defaultCategories: defaultData.categories.length, defaultReferences: defaultData.references.length, defaultCodes: defaultData.codes.length },
  workbook: { codes: sheetRows.Codigos.length, categories: sheetRows.Categorias.length, references: sheetRows.Referencias.length, history: sheetRows.Historico.length },
  effective: { categories: sourceCategories.length, references: sourceReferences.length }, web: { categories: webCategories.length, references: webReferences.length },
  categoryDifferences: categoryComparison.filter((row) => row.status !== 'Equivalente').map((row) => ({ key: row.key, status: row.status, fields: row.differences })),
  referenceDifferences: referenceComparison.filter((row) => row.status !== 'Equivalente').map((row) => ({ key: row.key, status: row.status, fields: row.differences })),
};
await fs.writeFile(path.join(root, 'docs', 'parity-summary.json'), `${JSON.stringify(summary, null, 2)}\n`, 'utf8');
console.log(JSON.stringify(summary, null, 2));
