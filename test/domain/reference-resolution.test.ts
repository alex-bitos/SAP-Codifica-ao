import { describe, expect, it } from 'vitest';
import { fieldDefinitions } from '../../src/domain/field-config.js';
import {
  characteristicForField,
  characteristicSourceField,
  dimensionalMillimeters,
  referenceDescriptionMatches,
  referenceLookupGroup,
} from '../../src/domain/reference-resolution.js';
import { findReferenceCode } from '../../src/services/codes.js';
import type { Category } from '../../src/types.js';

function category(overrides: Partial<Category>): Category {
  return {
    id: 'category-id', natureId: 'nature-id', nature: 'Produto Acabado', natureCode: 'PA',
    name: 'MaxiMesh', baseCode: 'PAMM',
    descriptionFormat: 'MaxiMesh <modelo> <geometria> - Malha <material malha> Grade <Material Grade> - #<espessura>mm x <dimensão>',
    characteristic1: 'Material da Malha', characteristic2: 'Dimensão MaxiMesh',
    codeFormula: '', requiredFields: ['modelo', 'geometria', 'material malha', 'Material Grade', 'espessura', 'dimensão'],
    example: '', active: true, ...overrides,
  };
}

describe('resolução de referências técnicas', () => {
  it('liga características com nomes legados aos campos efetivamente exibidos', () => {
    const maxiMesh = category({});
    const fiberBed = category({ name: 'FiberBed', characteristic1: 'Tipo', characteristic2: 'Material Grade', requiredFields: ['tipo', 'modelo', 'material grade'] });
    const chevron = category({ name: 'Chevron com Alojamento', characteristic1: 'Material', characteristic2: 'Dimensão Característica', requiredFields: ['material', 'módulo', 'modelo'] });
    const maxiPac = category({ name: 'MaxiPac', characteristic1: 'Material', characteristic2: 'Diâmetro Mesh', requiredFields: ['modelo', 'material', 'diametro'] });

    expect(characteristicSourceField(maxiMesh, 'Material da Malha')).toBe('material_malha');
    expect(characteristicForField(maxiMesh, 'dimensão')).toBe('Dimensão MaxiMesh');
    expect(characteristicSourceField(fiberBed, 'Material Grade')).toBe('material_grade');
    expect(characteristicSourceField(chevron, 'Dimensão Característica')).toBe('modulo');
    expect(characteristicSourceField(maxiPac, 'Diâmetro Mesh')).toBe('diametro');
  });

  it('usa os grupos oficiais especiais das categorias de Produto Acabado', () => {
    expect(referenceLookupGroup('MaxiMesh', 'Dimensão MaxiMesh')).toBe('Diâmetro Mesh');
    expect(referenceLookupGroup('FiberBed', 'Tipo')).toBe('Tipos de FiberBed');
    expect(referenceLookupGroup('Chevron com Alojamento', 'Dimensão Característica')).toBe('Alojamentos Chevron');
    expect(referenceLookupGroup('MaxiPac', 'Diâmetro Mesh')).toBe('Diâmetro Mesh');
  });

  it('resolve valores dimensionais dentro das faixas oficiais', () => {
    const rows = [
      { reference_group: 'Diâmetro Mesh', description: '0 a 500', code: '01' },
      { reference_group: 'Diâmetro Mesh', description: '501 a 1000', code: '02' },
      { reference_group: 'Diâmetro Mesh', description: '1001 a 1500', code: '03' },
    ];

    expect(dimensionalMillimeters('Ø1500 mm')).toBe(1500);
    expect(referenceDescriptionMatches('1001 a 1500', 'Ø1500 mm')).toBe(true);
    expect(findReferenceCode(rows, 'Dimensão MaxiMesh', '1500')).toBe('');
    expect(findReferenceCode(rows, referenceLookupGroup('MaxiMesh', 'Dimensão MaxiMesh'), '1500')).toBe('03');
  });

  it('entrega ao formulário do MaxiMesh as referências que realmente compõem o código', () => {
    const definitions = fieldDefinitions(category({}), [
      { group: 'Todos os materiais', description: '316L', code: 'I1', active: true },
      { group: 'Diâmetro Mesh', description: '1001 a 1500', code: '03', active: true },
    ]);
    const material = definitions.find((field) => field.key === 'material_malha')!;
    const dimension = definitions.find((field) => field.key === 'dimensao')!;
    const model = definitions.find((field) => field.key === 'modelo')!;

    expect(material).toMatchObject({ participatesInCode: true, referenceGroup: 'Material da Malha' });
    expect(material.options).toContain('316L');
    expect(dimension).toMatchObject({ participatesInCode: true, referenceGroup: 'Diâmetro Mesh' });
    expect(dimension.options).toContain('1001 a 1500');
    expect(model.participatesInCode).toBe(false);
  });

  it('não mistura opções genéricas nos campos bloqueados do Flange Cover', () => {
    const flangeCover = category({ name: 'Flange Cover', baseCode: 'PAFC', characteristic1: 'Modelo', characteristic2: 'Material', descriptionFormat: '<modelo> / <material> / <diametro> / <classe> / <dreno>', requiredFields: ['modelo', 'material', 'diametro', 'classe', 'dreno'] });
    const definitions = fieldDefinitions(flangeCover, [
      { group: 'Todos os materiais', description: '301', code: 'XX', active: true },
      { group: 'Diâmetro Mesh', description: '1001 a 1500', code: '03', active: true },
      { group: 'Flange Cover:Material', description: 'PVC', code: 'P4', active: true },
    ]);

    expect(definitions.find((field) => field.key === 'material')?.options).not.toContain('301');
    expect(definitions.find((field) => field.key === 'diametro')?.options).not.toContain('1001 a 1500');
    expect(definitions.every((field) => field.controlType === 'select')).toBe(true);
  });
});
