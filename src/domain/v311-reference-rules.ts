import { canonicalReferenceGroup } from './field-config.js';
import { normalizeText } from './normalization.js';

export type V311ReferenceRow = Record<string, unknown>;
const text = (row: V311ReferenceRow, key: string) => String(row[key] ?? '').trim();

function obsolete(row: V311ReferenceRow) {
  return ['flange cover modelo', 'flange cover norma', 'diametro flange cover', 'flange cover classe de pressao'].includes(normalizeText(text(row, 'Grupo')))
    || normalizeText(text(row, 'Observacao')).includes('incluida para flange cover');
}

export function v311ReferenceIdentityGroup(group: string) {
  const normalized = normalizeText(group);
  return normalized.startsWith('flange cover ') || normalized.startsWith('flange cover:') ? normalized : canonicalReferenceGroup(group);
}

export function v311ReferenceRows(sourceRows: V311ReferenceRow[]) {
  const rows: V311ReferenceRow[] = [];
  const positions = new Map<string, number>();
  for (const source of sourceRows) {
    if (!text(source, 'Grupo') || !text(source, 'Descricao') || obsolete(source)) continue;
    const key = `${v311ReferenceIdentityGroup(text(source, 'Grupo'))}|${normalizeText(text(source, 'Descricao'))}`;
    const position = positions.get(key);
    if (position === undefined) {
      positions.set(key, rows.length); rows.push({ ...source });
    } else if (text(source, 'Codigo')) {
      const current = rows[position];
      const official = normalizeText(text(current, 'Observacao')).includes('referencia oficial');
      rows[position] = official
        ? { ...current, Situacao: text(source, 'Situacao') || text(current, 'Situacao'), Observacao: text(current, 'Observacao') }
        : { ...current, ...source, Observacao: text(source, 'Observacao') || 'Referência carregada do banco vinculado' };
    }
  }
  return rows;
}
