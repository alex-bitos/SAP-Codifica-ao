import type { Category } from '../types.js';
import { fieldKey, normalizeText } from './normalization.js';

export function technicalFieldFamily(label: string) {
  const key = normalizeText(label);
  if (key.includes('schedule')) return 'schedule';
  if (key === 'norma do material') return 'norma_material';
  if (['norma dimensional', 'norma flange', 'norma pestana', 'norma uniao'].includes(key)) return 'norma_dimensional';
  if (key === 'diametro nominal') return 'diametro';
  if (key === 'classe de pressao' || key === 'lbs') return 'classe';
  if (key.includes('material')) return 'material';
  if (key.includes('espessura')) return 'espessura';
  if (key.includes('diametro') || key === 'tubo') return 'diametro';
  if (key.includes('dimens')) return 'dimensao';
  if (key.includes('acabamento')) return 'acabamento';
  if (key.includes('norma')) return 'norma';
  return key.replace(/\s+/g, '_');
}

function sourceCandidates(characteristic: string) {
  const normalized = normalizeText(characteristic);
  if (normalized === 'material da malha') return ['material_malha', 'material'];
  if (normalized === 'material grade') return ['material_grade', 'material'];
  if (normalized === 'dimensao maximesh') return ['dimensao', 'dimensoes'];
  if (normalized === 'dimensao caracteristica') return ['modulo', 'modelo', 'dimensao'];
  if (normalized === 'tipo') return ['tipo', 'modelo'];
  if (normalized.includes('material')) return ['material', 'material_grade', 'material_malha'];
  if (normalized.includes('espessura')) return ['espessura'];
  if (normalized.includes('diametro')) return ['diametro_nominal', 'diametro', 'tubo', 'dimensao'];
  if (normalized.includes('modelo')) return ['modelo'];
  return [fieldKey(characteristic)];
}

export function characteristicSourceField(category: Category, characteristic: string) {
  if (!characteristic) return '';
  const available = new Set(category.requiredFields.map(fieldKey));
  const exact = fieldKey(characteristic);
  if (available.has(exact)) return exact;
  return sourceCandidates(characteristic).find((candidate) => available.has(candidate)) || '';
}

export function characteristicForField(category: Category, label: string) {
  const key = fieldKey(label);
  return [category.characteristic1, category.characteristic2]
    .find((characteristic) => characteristicSourceField(category, characteristic) === key) || '';
}

export function referenceLookupGroup(categoryName: string, characteristic: string) {
  const category = normalizeText(categoryName);
  const normalized = normalizeText(characteristic);
  if (category === 'fiberbed' && normalized === 'tipo') return 'Tipos de FiberBed';
  if (category === 'maximesh' && normalized === 'dimensao maximesh') return 'Diâmetro Mesh';
  if (category === 'chevron com alojamento' && normalized === 'dimensao caracteristica') return 'Alojamentos Chevron';
  return characteristic;
}

export function dimensionalMillimeters(value: string) {
  const raw = String(value || '').trim().toUpperCase().replace(/,/g, '.');
  if (!raw || normalizeText(raw) === 'na') return null;
  let number: number | null = null;
  const mixed = raw.match(/(\d+)\s*[.\- ]\s*(\d+)\s*\/\s*(\d+)/);
  const fraction = raw.match(/(?:^|\s)(\d+)\s*\/\s*(\d+)/);
  if (mixed) number = Number(mixed[1]) + Number(mixed[2]) / Number(mixed[3]);
  else if (fraction) number = Number(fraction[1]) / Number(fraction[2]);
  else {
    const decimal = raw.match(/\d+(?:\.\d+)?/);
    if (decimal) number = Number(decimal[0]);
  }
  if (number === null || !Number.isFinite(number)) return null;
  return /["″]|\bPOL(?:EGADA)?S?\b/.test(raw) ? number * 25.4 : number;
}

export function referenceRangeContains(description: string, value: string) {
  const target = dimensionalMillimeters(value);
  const numbers = String(description || '').replace(/,/g, '.').match(/\d+(?:\.\d+)?/g);
  if (target === null || !numbers || numbers.length < 2 || !/(?:\ba\b|ate|até|-)/i.test(description)) return false;
  const low = Number(numbers[0]);
  const high = Number(numbers[1]);
  return target >= Math.min(low, high) && target <= Math.max(low, high);
}

export function referenceDescriptionMatches(description: string, value: string) {
  return normalizeText(description) === normalizeText(value) || referenceRangeContains(description, value);
}
