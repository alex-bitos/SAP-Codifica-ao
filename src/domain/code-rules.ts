import type { Category, CodeInput } from '../types.js';
import { canonicalCode, fieldKey, normalizeTechnicalValue, normalizeText } from './normalization.js';

export const ADMINISTRATIVE_FIELDS = new Set(['responsavel', 'tag', 'ncp', 'ncp_projeto', 'ncpprojeto', 'projeto', 'numero_de_serie', 'numerodeserie']);

export const FLANGE_COVER_CATALOG = {
  modelo: { EconoGard: 'EG', MetalGard: 'MG', SpraGard: 'SG', ValveGard: 'VG', VueGard: 'VU', ExpandoGard: 'EX' },
  material: { PP: 'P1', PTFE: 'P2', PE: 'P3', PVC: 'P4', '316L': 'P5', 'Aço Galvanizado': 'P6' },
  diametro: { '1/2"': '005', '1"': '010', '1 1/2"': '015', '2"': '020', '2 1/2"': '025', '3"': '030', '4"': '040', '5"': '050', '6"': '060', '8"': '080', '10"': '100', '12"': '120', '14"': '140', '16"': '160', '18"': '180', '20"': '200', '22"': '220', '24"': '240' },
  classe: { 'ANSI 150#': 'C1', 'ANSI 300#': 'C2', 'ANSI 600#': 'C3', 'ANSI 900#': 'C4', 'ANSI 1500#': 'C5', 'ANSI 3000#': 'C6', 'DIN PN6': 'D1', 'DIN PN10': 'D2', 'DIN PN16': 'D3', 'DIN PN25': 'D4', 'DIN PN40': 'D5', 'DIN PN63': 'D6' },
  dreno: { 'Sem dreno': '0', 'Com dreno': '1' },
} as const;

export function validateCompatibility(category: Category, attributes: Record<string, string>): string | undefined {
  const name = normalizeText(category.name);
  const controlled = ['flange', 'pestana', 'uniao roscada', 'uniao solda de encaixe'];
  if (name === 'tubo' && !['n', 'i'].includes(normalizeText(attributes.origem))) return 'A origem do Tubo deve ser N ou I.';
  if (!controlled.includes(name)) return;
  const materialStandard = attributes.norma_do_material || '';
  const dimensionalStandard = attributes.norma_dimensional || '';
  if (/\bB\s*16(?:[.\s]*(?:5|9|11|47))\b/i.test(materialStandard)) return `${materialStandard} é uma norma dimensional, não uma norma de material.`;
  if (/\bS[AB]\s*[- ]?\s*\d+/i.test(dimensionalStandard)) return `${dimensionalStandard} é uma especificação de material, não uma norma dimensional.`;
  if (name === 'flange' && !['rf', 'ff', 'rtj'].includes(normalizeText(attributes.face))) return 'A face do Flange deve ser RF, FF ou RTJ.';
  if (!['n', 'i'].includes(normalizeText(attributes.origem))) return 'A origem deve ser N ou I.';
}

export function technicalKey(category: Category, attributes: Record<string, string>): string {
  const parts = category.requiredFields
    .filter((field) => !ADMINISTRATIVE_FIELDS.has(fieldKey(field)))
    .map((field) => `${fieldKey(field)}=${normalizeTechnicalValue(field, attributes[fieldKey(field)])}`);
  return `${normalizeText(category.nature)}|${normalizeText(category.name)}|${parts.join('|')}`;
}

export function buildDescription(category: Category, attributes: Record<string, string>): string {
  const name = normalizeText(category.name);
  if (name === 'tubo') {
    const schedule = attributes.schedule_ou_espessura || attributes.schedule || attributes.espessura || '';
    return `Tubo - ${attributes.norma || ''} ${attributes.material || ''} - ${attributes.diametro || ''} ${schedule} - ${attributes.origem || ''}`.replace(/\s{2,}/g, ' ').trim();
  }
  if (name === 'flange') {
    const standard = /^ASME\s+/i.test(attributes.norma_dimensional || '') ? attributes.norma_dimensional : `ASME ${attributes.norma_dimensional || ''}`;
    return `Flange ${attributes.tipo || ''} - ${attributes.norma_do_material || ''} ${attributes.material || ''} - NPS ${String(attributes.diametro_nominal || '').replace(/^NPS\s*/i, '')} ${attributes.face || ''} - ${standard} #${String(attributes.classe_de_pressao || '').replace(/(?:class|classe|#)/ig, '').trim()} - ${attributes.origem || ''}`
      .replace(/\bNPS\s+NPS\b/ig, 'NPS').replace(/\bASME\s+ASME\b/ig, 'ASME').replace(/\s{2,}/g, ' ').trim();
  }
  let description = category.descriptionFormat
    .replace(/\bNCP\s*<ncp>/gi, '')
    .replace(/\bTAG\s*<tag>/gi, '')
    .replace(/\bProjeto\s*<projeto>/gi, '')
    .replace(/\b(?:Número de Série|Numero de Serie|Série|Serie)\s*<(?:número de série|numero de serie)>/gi, '');
  description = description.replace(/<([^>]+)>/g, (_match, inside) => {
    const alternatives = String(inside).split('|').map((item) => fieldKey(item.replace(/\?/g, '').trim()));
    if (alternatives.some((key) => ADMINISTRATIVE_FIELDS.has(key))) return '';
    for (const key of alternatives) if (attributes[key]) return attributes[key];
    return '';
  });
  description = description.replace(/\borigem\b/gi, attributes.origem || '')
    .replace(/(mm)\s*mm\b/gi, 'mm').replace(/(["″])\s*["″]/g, '"')
    .replace(/\s+-\s+-/g, ' - ').replace(/\s{2,}/g, ' ').replace(/\s+([,;])/g, '$1').trim();
  return description.replace(/^[a-zá-ú]/, (character) => character.toUpperCase()).slice(0, 200);
}

export function normalizedTechnicalDescription(value: string) {
  return normalizeText(value).replace(/\basme\s+(?=b\s*\d)/g, '').replace(/\bnps(?:\s+nps)+\b/g, 'nps')
    .replace(/\bf\s+(?=\d)/g, 'f').replace(/\bsa\s+(?=\d)/g, 'sa')
    .replace(/\bclass\s+(?=\d)/g, '').replace(/\s+/g, ' ').trim();
}

export function missingFields(category: Category, attributes: Record<string, string>): string[] {
  return category.requiredFields.filter((field) => !String(attributes[fieldKey(field)] || '').trim());
}

export function isFlangeCover(category: Category) {
  return normalizeText(category.name) === 'flange cover' || category.baseCode === 'PAFC';
}

function catalogCode(family: keyof typeof FLANGE_COVER_CATALOG, value: string): string {
  const entries = Object.entries(FLANGE_COVER_CATALOG[family]) as [string, string][];
  return entries.find(([description]) => normalizeText(description) === normalizeText(value))?.[1] || '';
}

export function buildFlangeCover(attributes: Record<string, string>, overrides: Record<string, string> = {}) {
  const fields = ['modelo', 'material', 'diametro', 'classe', 'dreno'] as const;
  const missing = fields.filter((field) => !attributes[field]);
  if (missing.length) throw new Error(`Preencha os campos obrigatórios: ${missing.join(', ')}`);
  const parts = Object.fromEntries(fields.map((field) => [field, overrides[`${field}:${normalizeText(attributes[field])}`] || catalogCode(field, attributes[field])])) as Record<typeof fields[number], string>;
  if (!/^[A-Z0-9]{2}$/.test(parts.modelo) || !/^[A-Z0-9]{2}$/.test(parts.material) || !/^[A-Z0-9]{3}$/.test(parts.diametro) || !/^[A-Z0-9]{2}$/.test(parts.classe) || !/^[A-Z0-9]$/.test(parts.dreno)) throw new Error('Referência Flange Cover ausente ou com tamanho inválido.');
  return {
    code: `PAFC${parts.modelo}${parts.material}${parts.diametro}${parts.classe}${parts.dreno}`,
    description: `${attributes.modelo} / ${attributes.material} / ${attributes.diametro} / ${attributes.classe} / ${attributes.dreno}`,
    parts,
  };
}

export function valueForCharacteristic(characteristic: string, attributes: Record<string, string>): string {
  const normalized = normalizeText(characteristic);
  const exact = attributes[fieldKey(characteristic)];
  if (exact) return exact;
  if (normalized === 'material da malha') return attributes.material_malha || attributes.material || '';
  if (normalized === 'material grade') return attributes.material_grade || attributes.material || '';
  if (normalized === 'dimensao maximesh') return attributes.dimensao || attributes.dimensoes || '';
  if (normalized === 'dimensao caracteristica') return attributes.modulo || attributes.modelo || attributes.dimensao || '';
  if (normalized.includes('material')) return attributes.material || attributes.material_grade || attributes.material_malha || '';
  if (normalized.includes('espessura')) return attributes.espessura || '';
  if (normalized.includes('diametro')) return attributes.diametro_nominal || attributes.diametro || attributes.tubo || attributes.dimensao || '';
  if (normalized.includes('modelo')) return attributes.modelo || '';
  if (normalized === 'tipo') return attributes.tipo || attributes.modelo || '';
  return '';
}

export function structuralPrefix(category: Category, c1: string, c2: string): string {
  const raw = canonicalCode(`${category.baseCode}${c1}${c2}`);
  if (raw.length > 8) throw new Error(`A composição ${raw} excede oito caracteres antes do sequencial.`);
  return raw.padEnd(8, '0');
}

export function composeSequentialCode(prefix: string, sequential: number): string {
  if (!/^[A-Z0-9]{8}$/.test(prefix) || sequential < 1 || sequential > 999999) throw new Error('Sequencial inválido.');
  return `${prefix}${String(sequential).padStart(6, '0')}`;
}

export function normalizeInput(input: CodeInput): CodeInput {
  return { ...input, attributes: Object.fromEntries(Object.entries(input.attributes).map(([key, value]) => [fieldKey(key), String(value).trim()])) };
}
