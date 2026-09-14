import { normalizeText } from './normalization.js';

export interface SearchableCategory { name: string; nature: string; active: boolean }

export function categorySearchScore(category: SearchableCategory, query: string) {
  const normalizedQuery = normalizeText(query);
  const name = normalizeText(category.name);
  const nature = normalizeText(category.nature);
  if (!normalizedQuery) return 0;
  if (name === normalizedQuery) return 100;
  if (name.startsWith(normalizedQuery)) return 80;
  if (name.includes(normalizedQuery)) return 60;
  const tokens = normalizedQuery.split(' ').filter(Boolean);
  const hits = tokens.filter((token) => name.includes(token) || nature.includes(token)).length;
  return hits ? 20 + hits * 10 : 0;
}

export function searchCategories<T extends SearchableCategory>(categories: T[], query: string, limit = 12) {
  return categories.filter((category) => category.active)
    .map((category) => ({ category, score: categorySearchScore(category, query) }))
    .filter((result) => result.score > 0)
    .sort((a, b) => b.score - a.score || a.category.name.localeCompare(b.category.name, 'pt-BR'))
    .slice(0, limit).map((result) => result.category);
}
