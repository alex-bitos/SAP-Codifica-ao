import type { Category } from '../types.js';
import { ADMINISTRATIVE_FIELDS, FLANGE_COVER_CATALOG } from './code-rules.js';
import { fieldKey, normalizeText } from './normalization.js';
import { characteristicForField, referenceLookupGroup, technicalFieldFamily } from './reference-resolution.js';

export interface TechnicalReference {
  group: string;
  description: string;
  code?: string;
  active?: boolean;
}

export interface FieldDefinition {
  key: string;
  label: string;
  required: true;
  position: number;
  controlType: 'select' | 'combobox' | 'text';
  options: string[];
  allowCustom: boolean;
  canRegisterOption: boolean;
  referenceGroup: string;
  participatesInDescription: boolean;
  participatesInTechnicalKey: boolean;
  participatesInCode: boolean;
  validation: string;
}

const GLOBAL_OPTIONS: Record<string, string[]> = {
  origem: ['N', 'I'],
  schedule: ['SCH 5S', 'SCH 10S', 'SCH 20', 'SCH 40', 'SCH 40S', 'SCH 80', 'SCH 80S', 'SCH 160', 'XXS'],
  acabamento: ['Laminado Frio', 'Laminado Quente', 'Decapado', 'Polido', 'Escovado', 'Lisa'],
  face: ['RF', 'FF', 'RTJ'],
  norma: ['SA-240', 'SA-312', 'SA-182', 'SA-403', 'SA-105', 'B16.5', 'B16.9', 'B16.11'],
};

const CATEGORY_OPTIONS: Record<string, Record<string, string[]>> = {
  valvula: {
    tipo: ['Esfera', 'Borboleta', 'Gaveta', 'Globo', 'Retenção', 'Agulha', 'Diafragma', 'Macho', 'Controle', 'Alívio', 'Segurança'],
    classe: ['125', '150', '300', '600', '900', '1500', '2500', 'PN10', 'PN16', 'PN25', 'PN40'],
    conexao: ['Flangeada', 'Roscada NPT', 'Roscada BSP', 'Solda de topo', 'Solda de encaixe', 'Wafer', 'Lug', 'Sanitária'],
    acionamento: ['Manual por alavanca', 'Manual por volante', 'Pneumático', 'Elétrico', 'Hidráulico', 'Solenoide', 'Automático'],
  },
  instrumento: {
    tipo: ['Indicador', 'Transmissor', 'Indicador-transmissor', 'Chave', 'Controlador', 'Sensor', 'Analisador', 'Medidor', 'Termômetro', 'Manômetro'],
    variavel: ['Pressão', 'Pressão diferencial', 'Temperatura', 'Vazão', 'Nível', 'pH', 'Condutividade', 'Densidade', 'Concentração', 'Vibração', 'Posição', 'Velocidade'],
    sinal: ['4-20 mA', '0-10 V', 'HART', 'Foundation Fieldbus', 'Profibus', 'Modbus', 'Contato seco', 'Pneumático', 'Sem sinal'],
    conexao: ['1/4 NPT', '1/2 NPT', '3/4 NPT', 'Flangeada', 'Sanitária', 'Remota'],
  },
  flange: {
    tipo: ['Sobreposto', 'Weld Neck', 'Cego', 'Roscado', 'Encaixe para solda', 'Lap Joint'],
    classe: ['150', '300', '600', '900', '1500', '2500'], face: ['RF', 'FF', 'RTJ'],
  },
};

const SHEET_THICKNESS = ['0,40mm', '0,50mm', '0,60mm', '0,80mm', '1,00mm', '1,20mm', '1,50mm', '2,00mm', '2,50mm', '3,00mm', '3,20mm', '4,00mm', '4,50mm', '4,75mm', '5,00mm', '6,00mm', '6,35mm', '8,00mm', '9,50mm', '10,00mm', '12,00mm', '12,70mm', '15,00mm', '16,00mm', '19,00mm', '19,05mm', '20,00mm', '25,00mm', '25,40mm', '30,00mm', '32,00mm', '38,10mm', '40,00mm', '50,00mm', '1/64"', '1/32"', '3/64"', '1/16"', '5/64"', '3/32"', '1/8"', '3/16"', '1/4"', '5/16"', '3/8"', '1/2"', '5/8"', '3/4"', '1"', '1.1/4"', '1.1/2"', '2"'];
const PIPE_DIAMETERS = ['NPS 1/8"', 'NPS 1/4"', 'NPS 3/8"', 'NPS 1/2"', 'NPS 3/4"', 'NPS 1"', 'NPS 1.1/4"', 'NPS 1.1/2"', 'NPS 2"', 'NPS 2.1/2"', 'NPS 3"', 'NPS 4"', 'NPS 5"', 'NPS 6"', 'NPS 8"', 'NPS 10"', 'NPS 12"', 'NPS 14"', 'NPS 16"', 'NPS 18"', 'NPS 20"', 'NPS 24"', 'NPS 30"', 'NPS 36"', 'NPS 42"', 'NPS 48"'];
const SCHEDULES = ['SCH 5', 'SCH 5S', 'SCH 10', 'SCH 10S', 'SCH 20', 'SCH 30', 'SCH 40', 'SCH 40S', 'SCH 60', 'SCH 80', 'SCH 80S', 'SCH 100', 'SCH 120', 'SCH 140', 'SCH 160', 'STD', 'XS', 'XXS'];
const THREADS = ['Passo normal', 'Passo fino', 'UNC', 'UNF', 'UNEF', 'BSW', 'BSP', 'NPT'];
const FASTENER_DIAMETERS = ['M3', 'M4', 'M5', 'M6', 'M8', 'M10', 'M12', 'M14', 'M16', 'M18', 'M20', 'M22', 'M24', 'M27', 'M30', 'M33', 'M36', 'M39', 'M42', 'M48', 'M52', 'M56', 'M64', '1/8"', '3/16"', '1/4"', '5/16"', '3/8"', '7/16"', '1/2"', '9/16"', '5/8"', '3/4"', '7/8"', '1"', '1.1/8"', '1.1/4"', '1.3/8"', '1.1/2"', '1.3/4"', '2"'];
const WIRE_DIAMETERS = ['0,10mm', '0,15mm', '0,20mm', '0,25mm', '0,30mm', '0,40mm', '0,50mm', '0,60mm', '0,80mm', '1,00mm', '1,20mm', '1,50mm', '1,60mm', '2,00mm', '2,40mm', '2,50mm', '3,00mm', '3,20mm', '4,00mm', '4,80mm', '5,00mm', '6,00mm', '6,35mm', '8,00mm', '10,00mm', '12,00mm'];

export function canonicalReferenceGroup(value: string) {
  const normalized = normalizeText(value);
  if (normalized.includes('materia')) return 'material';
  if (normalized.includes('diametro') && (normalized.includes('fix') || normalized.includes('parafuso'))) return 'diametro fixacao';
  if (normalized.includes('diametro') && (normalized.includes('tubo') || normalized.includes('tubulacao') || normalized.includes('conexao'))) return 'diametro tubulacao';
  if (normalized.includes('espessura') && normalized.includes('chapa')) return 'espessura chapa';
  if (normalized.includes('espessura') && (normalized.includes('slit') || normalized.includes('bobina'))) return 'espessura bobina';
  if (normalized.includes('diametro') && normalized.includes('fio')) return 'diametro fio';
  if (normalized.includes('diametro') && normalized.includes('arame')) return 'diametro arame';
  return normalized.replace(/\b(de|do|da|para)\b/g, '').replace(/fixacoes/g, 'fixacao').replace(/\s+/g, ' ').trim();
}

export function referenceGroupFor(category: Category, label: string) {
  const categoryKey = normalizeText(category.name);
  const fieldFamily = technicalFieldFamily(label);
  const special: Record<string, Record<string, string>> = {
    flange: { norma_material: 'Flange:NormaMaterial', material: 'Flange:Material', diametro: 'Flange:DiametroNominal', face: 'Flange:Face', norma_dimensional: 'Flange:NormaDimensional', classe: 'Flange:ClassePressao', tipo: 'Flange:Tipo' },
    pestana: { norma_material: 'Pestana:NormaMaterial', material: 'Pestana:Material', diametro: 'Pestana:DiametroNominal', norma_dimensional: 'Pestana:NormaDimensional' },
    'uniao roscada': { norma_material: 'União Roscada:NormaMaterial', material: 'União Roscada:Material', diametro: 'União Roscada:DiametroNominal', norma_dimensional: 'União Roscada:NormaDimensional', classe: 'União Roscada:ClassePressao' },
    'uniao solda de encaixe': { norma_material: 'União Solda de Encaixe:NormaMaterial', material: 'União Solda de Encaixe:Material', diametro: 'União Solda de Encaixe:DiametroNominal', norma_dimensional: 'União Solda de Encaixe:NormaDimensional', classe: 'União Solda de Encaixe:ClassePressao' },
    'flange cover': { modelo: 'Flange Cover:Modelo', material: 'Flange Cover:Material', diametro: 'Flange Cover:Diametro', classe: 'Flange Cover:Classe', dreno: 'Flange Cover:Dreno' },
  };
  if (special[categoryKey]?.[fieldFamily]) return special[categoryKey][fieldFamily];
  const characteristic = characteristicForField(category, label);
  return characteristic ? referenceLookupGroup(category.name, characteristic) : `${category.name}:${label}`;
}

function staticOptions(category: Category, label: string) {
  const categoryKey = normalizeText(category.name);
  const key = fieldKey(label);
  const fieldFamily = technicalFieldFamily(label);
  const options = [...(GLOBAL_OPTIONS[key] || []), ...(GLOBAL_OPTIONS[fieldFamily] || []), ...(CATEGORY_OPTIONS[categoryKey]?.[key] || []), ...(CATEGORY_OPTIONS[categoryKey]?.[fieldFamily] || [])];
  if (categoryKey === 'flange cover' && fieldFamily in FLANGE_COVER_CATALOG) options.push(...Object.keys(FLANGE_COVER_CATALOG[fieldFamily as keyof typeof FLANGE_COVER_CATALOG]));
  if (fieldFamily === 'espessura' && ['chapa', 'barra chata', 'anel'].includes(categoryKey)) options.push(...SHEET_THICKNESS);
  if (fieldFamily === 'diametro' && ['tubo', 'flange', 'cotovelo', 'curva', 'tee', 'reducao', 'cap', 'uniao roscada', 'uniao solda de encaixe', 'meia luva', 'luva', 'pestana', 'plugue', 'bujao'].includes(categoryKey)) options.push(...PIPE_DIAMETERS);
  if (fieldFamily === 'diametro' && ['parafuso', 'porca', 'arruela', 'estojo', 'barra roscada', 'jbolt', 'lbolt', 'grampo', 'gancho', 'abracadeira'].includes(categoryKey)) options.push(...FASTENER_DIAMETERS);
  if (fieldFamily === 'diametro' && ['arame', 'fio', 'malha', 'malha bgon', 'consumivel de solda'].includes(categoryKey)) options.push(...WIRE_DIAMETERS);
  if (fieldFamily === 'schedule') options.push(...SCHEDULES);
  if (['rosca', 'unc', 'passo'].includes(key)) options.push(...THREADS);
  if (fieldFamily === 'norma_material') options.push('SA-105', 'SA-182', 'SA-240', 'SA-403', 'SB-462', 'SB-463');
  if (fieldFamily === 'norma_dimensional') options.push(...(categoryKey === 'flange' ? ['ASME B16.5', 'ASME B16.47'] : categoryKey === 'pestana' ? ['ASME B16.9'] : ['ASME B16.11']));
  if (fieldFamily === 'face') options.push('RF', 'FF', 'RTJ');
  return options;
}

function unique(values: string[]) {
  const seen = new Set<string>();
  return values.filter((value) => {
    const key = normalizeText(value);
    if (!key || seen.has(key)) return false;
    seen.add(key); return true;
  }).sort((a, b) => a.localeCompare(b, 'pt-BR', { numeric: true, sensitivity: 'base' }));
}

export function fieldDefinitions(category: Category, references: TechnicalReference[]): FieldDefinition[] {
  return category.requiredFields.map((label, position) => {
    const key = fieldKey(label);
    const fieldFamily = technicalFieldFamily(label);
    const referenceGroup = referenceGroupFor(category, label);
    const flangeCover = normalizeText(category.name) === 'flange cover';
    const matching = references.filter((reference) => reference.active !== false && (
      flangeCover
        ? normalizeText(reference.group) === normalizeText(referenceGroup)
        : canonicalReferenceGroup(reference.group) === canonicalReferenceGroup(referenceGroup)
          || canonicalReferenceGroup(reference.group) === canonicalReferenceGroup(label)
          || (fieldFamily === 'material' && ['material', 'inox', 'metais', 'plasticos', 'ceramica'].some((part) => normalizeText(reference.group).includes(part)))
          || (fieldFamily === 'diametro' && normalizeText(reference.group).includes('diametro'))
          || (fieldFamily === 'espessura' && normalizeText(reference.group).includes('espessura'))
    )).map((reference) => reference.description);
    const options = unique([...staticOptions(category, label), ...matching]);
    const locked = flangeCover || key === 'origem';
    const characteristic = characteristicForField(category, label);
    const normalizedFormat = normalizeText(category.descriptionFormat);
    return {
      key, label, required: true, position,
      controlType: locked ? 'select' : options.length ? 'combobox' : 'text',
      options, allowCustom: !locked, canRegisterOption: !locked,
      referenceGroup,
      participatesInDescription: normalizedFormat.includes(normalizeText(label)),
      participatesInTechnicalKey: !ADMINISTRATIVE_FIELDS.has(key),
      participatesInCode: flangeCover || Boolean(characteristic),
      validation: key === 'origem' ? 'N ou I' : locked ? 'Valor do catálogo oficial' : characteristic ? `Código de 2 caracteres · grupo ${referenceGroup}` : '',
    };
  });
}
