import { normalizeText } from './normalization.js';

export type V311CategoryRow = Record<string, unknown>;

const text = (row: V311CategoryRow, key: string) => String(row[key] ?? '').trim();
const fields = (row: V311CategoryRow) => text(row, 'CamposObrigatorios').split(';').map((item) => item.trim()).filter(Boolean);

const TUBE_RULE: V311CategoryRow = {
  Categoria: 'Tubo',
  FormatoDescricao: 'Tubo - <norma> <material> - <diametro> <schedule ou espessura> - <origem>',
  Caracteristica1: 'Material',
  Caracteristica2: 'Diâmetro Tubo',
  FormulaCodigo: 'Código Base + Material + Diâmetro Tubo + Sequencial',
  CamposObrigatorios: 'norma; material; diametro; schedule ou espessura; origem',
  Exemplo: 'Tubo - SA-312 904L - NPS 3" SCH 80s - N',
  Situacao: 'Ativo',
};

const FINISHED_PRODUCT_RULES: Record<string, { base: string; characteristic1: string; characteristic2: string; formula: string }> = {
  'Chevron com Alojamento': { base: 'PACA', characteristic1: 'Material', characteristic2: 'Dimensão Característica', formula: 'Código Base + Material + Dimensão Característica + Sequencial' },
  Coletor: { base: 'PACO', characteristic1: '', characteristic2: '', formula: 'Código Base + Sequencial' },
  Distribuidores: { base: 'PAFL', characteristic1: '', characteristic2: '', formula: 'Código Base + Sequencial' },
  FiberBed: { base: 'PAFB', characteristic1: 'Tipo', characteristic2: 'Material Grade', formula: 'Código Base + Tipo + Material Grade + Sequencial' },
  Limitadores: { base: 'PALM', characteristic1: '', characteristic2: '', formula: 'Código Base + Sequencial' },
  MaxiMesh: { base: 'PAMM', characteristic1: 'Material da Malha', characteristic2: 'Dimensão MaxiMesh', formula: 'Código Base + Material da Malha + Dimensão MaxiMesh + Sequencial' },
  MaxiPac: { base: 'PARE', characteristic1: 'Material', characteristic2: 'Diâmetro Mesh', formula: 'Código Base + Material + Diâmetro Mesh + Sequencial' },
  'Recheio Randomico': { base: 'PARR', characteristic1: 'Material', characteristic2: '', formula: 'Código Base + Material + Sequencial' },
  Suporte: { base: 'PASU', characteristic1: '', characteristic2: '', formula: 'Código Base + Sequencial' },
  Vaso: { base: 'PAVA', characteristic1: '', characteristic2: '', formula: 'Código Base + Sequencial' },
};

const SERVICE_BASES: Record<string, string> = {
  RH: 'SERH', Manufatura: 'SEMA', Engenharia: 'SEEN', TI: 'SETI', Administração: 'SEAD',
  Beneficiamento: 'SEBM', Advocacia: 'SEAV', Manutenção: 'SEMN',
};

const ADMINISTRATIVE_CHARACTERISTICS = new Set(['tag', 'ncp', 'projeto', 'numero de serie']);

function formula(row: V311CategoryRow) {
  return text(row, 'FormulaCodigo') || ['Código Base', text(row, 'Caracteristica1'), text(row, 'Caracteristica2'), 'Sequencial'].filter(Boolean).join(' + ');
}

function normalizeNature(value: string) {
  return normalizeText(value) === 'produto intermediario' ? 'Produto Intermediário' : value.trim();
}

export function applyV311CategoryRules(source: V311CategoryRow): V311CategoryRow {
  const row: V311CategoryRow = { ...source, Natureza: normalizeNature(text(source, 'Natureza')) };
  const categoryKey = normalizeText(text(row, 'Categoria'));

  if (categoryKey === 'tubo') Object.assign(row, TUBE_RULE);
  if (categoryKey === 'flange') Object.assign(row, {
    FormatoDescricao: 'Flange <tipo> - <norma do material> <material> - NPS <diametro nominal> <face> - <norma dimensional> #<classe de pressao> - <origem>',
    CamposObrigatorios: 'tipo; norma do material; material; diametro nominal; face; norma dimensional; classe de pressao; origem',
    Exemplo: 'Flange Sobreposto - SA-182 F304L - NPS 8" RF - ASME B16.5 #150 - N',
  });
  if (categoryKey === 'pestana') Object.assign(row, {
    FormatoDescricao: 'Pestana <tipo> - <norma do material> <material> - <norma dimensional> NPS <diametro nominal> x #<espessura> - <origem>',
    CamposObrigatorios: 'tipo; norma do material; material; norma dimensional; diametro nominal; espessura; origem',
  });
  if (categoryKey === 'uniao roscada') Object.assign(row, {
    FormatoDescricao: 'Uniao Roscada - <norma do material> <material> - <norma dimensional> <classe de pressao># NPS <diametro nominal> NPT - <origem>',
    CamposObrigatorios: 'norma do material; material; norma dimensional; classe de pressao; diametro nominal; origem',
  });
  if (categoryKey === 'uniao solda de encaixe') Object.assign(row, {
    FormatoDescricao: 'Uniao Solda de Encaixe - <norma do material> <material> - <norma dimensional> <classe de pressao># NPS <diametro nominal> SW - <origem>',
    CamposObrigatorios: 'norma do material; material; norma dimensional; classe de pressao; diametro nominal; origem',
  });
  if (categoryKey === 'flange cover') Object.assign(row, {
    Natureza: 'Produto Acabado', Categoria: 'Flange Cover', CodigoBase: 'PAFC',
    FormatoDescricao: '<modelo> / <material> / <diametro> / <classe> / <dreno>',
    Caracteristica1: 'Modelo', Caracteristica2: 'Material',
    FormulaCodigo: 'PAFC + Modelo(2) + Material(2) + Diâmetro(3) + Classe de Pressão(2) + Dreno(1)',
    CamposObrigatorios: 'modelo; material; diametro; classe; dreno',
    Exemplo: 'EconoGard / PVC / 2" / ANSI 150# / Sem dreno', Situacao: 'Ativo',
  });

  const official = text(row, 'Natureza') === 'Produto Acabado' ? FINISHED_PRODUCT_RULES[text(row, 'Categoria')] : undefined;
  if (official) {
    row.CodigoBase = official.base;
    row.Caracteristica1 = official.characteristic1;
    row.Caracteristica2 = official.characteristic2;
    row.FormulaCodigo = official.formula;
    if (text(row, 'Categoria') === 'FiberBed' && !fields(row).some((field) => normalizeText(field) === 'tipo')) {
      row.CamposObrigatorios = `tipo; ${text(row, 'CamposObrigatorios')}`;
    }
  }

  if (text(row, 'Natureza') === 'Serviços') {
    if (text(row, 'Categoria') === 'Recursos Humanos') row.Categoria = 'RH';
    if (text(row, 'Categoria') === 'Tecnologia da Informação') row.Categoria = 'TI';
    if (SERVICE_BASES[text(row, 'Categoria')]) row.CodigoBase = SERVICE_BASES[text(row, 'Categoria')];
    row.FormulaCodigo = formula(row);
  }

  if (text(row, 'Categoria') === 'FiberBed') {
    row.FormatoDescricao = 'FiberBed <tipo> <modelo> <fixação> - Grade <material grade> - Leito <material leito> - Fixações <material fixações>';
  }
  if (text(row, 'Categoria') === 'Bomba') Object.assign(row, {
    FormatoDescricao: 'Bomba <tipo> - Vazao <vazao> - Pressao <pressao> - <material> - <fabricante> <modelo> - Aplicacao <aplicacao>',
    CamposObrigatorios: 'tipo; vazao; pressao; material; fabricante; modelo; aplicacao; ncp; tag; projeto',
    Caracteristica1: '', Caracteristica2: '', FormulaCodigo: 'Código Base + Sequencial',
  });

  const identities = fields(row).map(normalizeText);
  const currentFormat = text(row, 'FormatoDescricao');
  if (identities.includes('tipo') && !/<\s*tipo\s*[?>]/i.test(currentFormat)) row.FormatoDescricao = `${currentFormat} - Tipo <tipo>`;
  if (identities.includes('modelo') && !/<\s*modelo\s*[?>]/i.test(text(row, 'FormatoDescricao'))) row.FormatoDescricao = `${text(row, 'FormatoDescricao')} - Modelo <modelo>`;
  row.FormulaCodigo = formula(row);

  if (ADMINISTRATIVE_CHARACTERISTICS.has(normalizeText(text(row, 'Caracteristica1')))) row.Caracteristica1 = '';
  if (ADMINISTRATIVE_CHARACTERISTICS.has(normalizeText(text(row, 'Caracteristica2')))) row.Caracteristica2 = '';
  row.FormatoDescricao = text(row, 'FormatoDescricao')
    .replace(/\s*-\s*(?:TAG|NCP|Projeto)\s*<(?:tag|ncp|projeto)>/gi, '')
    .replace(/\s*-\s*(?:Número de Série|Numero de Serie|Série|Serie)\s*<(?:número de série|numero de serie)>/gi, '')
    .replace(/\s*-\s*<(?:tag|ncp|projeto|número de série|numero de serie)>/gi, '')
    .trim();
  if (normalizeText(text(row, 'Categoria')) === 'imoveis') Object.assign(row, {
    Caracteristica1: 'Tipo de Imóvel', Caracteristica2: '',
    FormatoDescricao: 'Imovel - <tipo de imovel> - <localidade> - <identificacao>',
  });
  return row;
}

export function v311CategoryRows(sourceRows: V311CategoryRow[]) {
  const rows = sourceRows.map(applyV311CategoryRules);
  const has = (nature: string, category: string) => rows.some((row) =>
    normalizeText(text(row, 'Natureza')) === normalizeText(nature) && normalizeText(text(row, 'Categoria')) === normalizeText(category));
  const tube = rows.find((row) => normalizeText(text(row, 'Natureza')) === 'materia prima' && normalizeText(text(row, 'Categoria')) === 'tubo');
  if (tube && !has('Produto Intermediário', 'Tubo')) rows.push(applyV311CategoryRules({ ...tube, Natureza: 'Produto Intermediário', CodigoBase: 'PITU' }));
  const packing = rows.find((row) => normalizeText(text(row, 'Natureza')) === 'materia prima' && normalizeText(text(row, 'Categoria')) === 'recheio randomico');
  if (packing && !has('Produto Intermediário', 'Recheio Randomico')) rows.push(applyV311CategoryRules({ ...packing, Natureza: 'Produto Intermediário', CodigoBase: 'PIRR', Situacao: 'Inativo' }));
  return rows;
}
