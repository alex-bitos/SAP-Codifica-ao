export function normalizeText(value: unknown): string {
  return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

export function canonicalCode(value: unknown): string {
  return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export function fieldKey(value: unknown): string {
  return normalizeText(value).replace(/\s+/g, '_');
}

export function normalizeTechnicalValue(field: string, value: unknown): string {
  const key = fieldKey(field);
  let text = normalizeText(value).replace(/\bnao aplicavel\b/g, 'na');
  if (key.includes('schedule')) return text.replace(/\bschedule\b/g, 'sch').replace(/\s+/g, '');
  if (key === 'diametro_nominal' || key === 'diametro') {
    return text.replace(/\bnps\b/g, '').replace(/\bpol(?:egada)?s?\b/g, '').replace(/\s+/g, '');
  }
  if (['classe_de_pressao', 'classe', 'lbs'].includes(key)) {
    return text.replace(/\b(class|classe|lbs|lb)\b/g, '').replace(/\s+/g, '');
  }
  if (key === 'face' || key === 'origem') return text.replace(/\s+/g, '');
  return text.replace(/\s+/g, ' ').trim();
}

export function canonicalGroup(group: unknown): string {
  const value = normalizeText(group);
  if (value.includes('materia')) return 'material';
  if (value.includes('diametro') && (value.includes('fix') || value.includes('parafuso'))) return 'diametro fixacao';
  if (value.includes('diametro') && (value.includes('tubo') || value.includes('tubulacao') || value.includes('conexao'))) return 'diametro tubulacao';
  if (value.includes('espessura') && value.includes('chapa')) return 'espessura chapa';
  if (value.includes('espessura') && (value.includes('slit') || value.includes('bobina'))) return 'espessura bobina';
  if (value.includes('diametro') && value.includes('fio')) return 'diametro fio';
  return value.replace(/\b(de|do|da|para)\b/g, '').replace(/fixacoes/g, 'fixacao').replace(/\s+/g, ' ').trim();
}
