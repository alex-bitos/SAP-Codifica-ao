import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildDescription, technicalKey } from '../../src/domain/code-rules.js';
import { searchCategories } from '../../src/domain/category-search.js';
import { canonicalReferenceGroup, fieldDefinitions } from '../../src/domain/field-config.js';
import { canonicalCode, fieldKey, normalizeText } from '../../src/domain/normalization.js';
import { characteristicSourceField } from '../../src/domain/reference-resolution.js';
import type { Category } from '../../src/types.js';

const root = process.cwd();
const seed = JSON.parse(fs.readFileSync(path.join(root, 'seeds', 'v311-complete.json'), 'utf8'));
const summary = JSON.parse(fs.readFileSync(path.join(root, 'docs', 'parity-summary.json'), 'utf8'));

function categoryFromRow(row: Record<string, unknown>): Category {
  return {
    id: String(row.CodigoBase), natureId: String(row.Natureza), nature: String(row.Natureza), natureCode: String(row.CodigoBase).slice(0, 2),
    name: String(row.Categoria), baseCode: String(row.CodigoBase), descriptionFormat: String(row.FormatoDescricao),
    characteristic1: String(row.Caracteristica1 || ''), characteristic2: String(row.Caracteristica2 || ''),
    codeFormula: String(row.FormulaCodigo || ''), requiredFields: String(row.CamposObrigatorios).split(';').map((item) => item.trim()).filter(Boolean),
    example: String(row.Exemplo || ''), active: normalizeText(row.Situacao) !== 'inativo',
  };
}

const categories = seed.sheets.Categorias.map(categoryFromRow);
const references = seed.sheets.Referencias.map((row: Record<string, unknown>) => ({
  group: String(row.Grupo), description: String(row.Descricao), code: String(row.Codigo || ''), active: normalizeText(row.Situacao) !== 'inativo',
}));
const find = (nature: string, name: string) => categories.find((category: Category) => normalizeText(category.nature) === normalizeText(nature) && normalizeText(category.name) === normalizeText(name))!;

describe('paridade integral automatizada com a V3.11', () => {
  it('mantém as quantidades oficiais e nenhuma diferença de catálogo', () => {
    expect(summary.source).toEqual({ defaultCategories: 140, defaultReferences: 603, defaultCodes: 83 });
    expect(summary.workbook).toEqual({ codes: 986, categories: 145, references: 604, history: 5 });
    expect(summary.effective).toEqual({ categories: 147, references: 574 });
    expect(summary.web).toEqual(summary.effective);
    expect(summary.categoryDifferences).toEqual([]);
    expect(summary.referenceDifferences).toEqual([]);
  });

  it('preserva todas as linhas históricas e seus códigos sem renumeração', () => {
    expect(seed.sheets.Codigos).toHaveLength(986);
    const exact = seed.sheets.Codigos.map((row: Record<string, unknown>) => String(row.CodigoSAP));
    expect(new Set(exact).size).toBe(986);
    expect(new Set(exact.map(canonicalCode)).size).toBe(986);
    expect(seed.sheets.Historico).toHaveLength(5);
  });

  it('não perde, duplica nem reordena campos em nenhuma categoria', () => {
    expect(categories).toHaveLength(147);
    for (const category of categories) {
      const definitions = fieldDefinitions(category, references);
      expect(definitions.map((field) => field.key), `${category.nature}/${category.name}`).toEqual(category.requiredFields.map(fieldKey));
      expect(definitions.map((field) => field.position)).toEqual(category.requiredFields.map((_: string, index: number) => index));
      expect(definitions.every((field) => field.required)).toBe(true);
    }
  });

  it('mantém os campos críticos de Chapa, Tubo MP, Tubo PI, Flange e Instrumento', () => {
    expect(find('Matéria Prima', 'Chapa').requiredFields.map(fieldKey)).toEqual(['norma', 'material', 'espessura', 'largura', 'comprimento', 'acabamento', 'origem']);
    expect(find('Matéria Prima', 'Tubo')).toMatchObject({ baseCode: 'MPTU', requiredFields: ['norma', 'material', 'diametro', 'schedule ou espessura', 'origem'] });
    expect(find('Produto Intermediário', 'Tubo')).toMatchObject({ baseCode: 'PITU', requiredFields: ['norma', 'material', 'diametro', 'schedule ou espessura', 'origem'] });
    expect(find('Matéria Prima', 'Flange').requiredFields.map(fieldKey)).toEqual(['tipo', 'norma_do_material', 'material', 'diametro_nominal', 'face', 'norma_dimensional', 'classe_de_pressao', 'origem']);
    expect(find('Produto Intermediário', 'Instrumento').requiredFields.map(fieldKey)).toEqual(['tipo', 'variavel', 'faixa', 'conexao', 'sinal', 'fabricante', 'modelo', 'origem']);
  });

  it('resolve no catálogo oficial todas as características codificadoras de Produto Acabado', () => {
    const codedReferenceGroups = new Set(references.filter((reference: { code?: string }) => reference.code)
      .map((reference: { group: string }) => canonicalReferenceGroup(reference.group)));
    const finishedProducts = categories.filter((category: Category) => category.nature === 'Produto Acabado' && normalizeText(category.name) !== 'flange cover');

    for (const category of finishedProducts) {
      const definitions = fieldDefinitions(category, references);
      for (const characteristic of [category.characteristic1, category.characteristic2].filter(Boolean)) {
        const sourceKey = characteristicSourceField(category, characteristic);
        const definition = definitions.find((field) => field.key === sourceKey);
        expect(sourceKey, `${category.name}/${characteristic}`).not.toBe('');
        expect(definition, `${category.name}/${characteristic}`).toBeDefined();
        expect(definition?.participatesInCode, `${category.name}/${characteristic}`).toBe(true);
        expect(codedReferenceGroups.has(canonicalReferenceGroup(definition?.referenceGroup || '')), `${category.name}/${characteristic}/${definition?.referenceGroup}`).toBe(true);
      }
    }
  });

  it('mantém todas as referências efetivas semanticamente únicas', () => {
    expect(references).toHaveLength(574);
    const keys = references.map((reference: { group: string; description: string }) => `${normalizeText(reference.group).startsWith('flange cover') ? normalizeText(reference.group) : canonicalReferenceGroup(reference.group)}|${normalizeText(reference.description)}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('busca parcialmente por categoria ou natureza sem diferenciar acentos e caixa', () => {
    expect(searchCategories(categories, 'tubo').map((item) => item.baseCode)).toEqual(expect.arrayContaining(['MPTU', 'PITU']));
    expect(searchCategories(categories, 'INSTRUMENTO').length).toBeGreaterThan(0);
    expect(searchCategories(categories, 'materia prima').every((item) => normalizeText(item.nature).includes('materia prima'))).toBe(true);
    expect(searchCategories(categories, 'xyzabc')).toEqual([]);
  });

  it('remove placeholders vazios e aplica a identidade técnica oficial', () => {
    const category = find('Outros', 'Despesas Diversas');
    const description = buildDescription(category, { tipo: 'Frete', referencia: 'ABC', observacao: 'Urgente' });
    expect(description).not.toContain('NA');
    const keyA = technicalKey(category, { tipo: 'Frete', referencia: 'ABC', observacao: 'Urgente', tag: 'T-1' });
    const keyB = technicalKey(category, { tipo: 'Frete', referencia: 'ABC', observacao: 'Urgente', tag: 'T-2' });
    const keyC = technicalKey(category, { tipo: 'Frete', referencia: 'ABC', observacao: 'Outra', tag: 'T-2' });
    expect(keyA).toBe(keyB);
    expect(keyA).not.toBe(keyC);
  });

  it('a tela inicia sem o antigo bloco administrativo universal', () => {
    const html = fs.readFileSync(path.join(root, 'public', 'index.html'), 'utf8');
    const script = fs.readFileSync(path.join(root, 'public', 'app.js'), 'utf8');
    expect(html).toContain('Busca rápida de categoria');
    expect(html).toContain('Selecione uma categoria.');
    expect(html).not.toContain('<summary>Dados administrativos</summary>');
    expect(html).toContain('Não foi possível carregar as naturezas e categorias do banco central.');
    expect(script).not.toContain('event.currentTarget.reset()');
  });
});
