import { describe, expect, it } from 'vitest';
import { buildDescription, buildFlangeCover, composeSequentialCode, missingFields, structuralPrefix, technicalKey, validateCompatibility } from '../../src/domain/code-rules.js';
import type { Category } from '../../src/types.js';

const tube = (nature: string, natureCode: string, baseCode: string): Category => ({
  id: `${natureCode}-tube`, natureId: natureCode, nature, natureCode, name: 'Tubo', baseCode,
  descriptionFormat: 'Tubo - <norma> <material> - <diametro> <schedule ou espessura> - <origem>',
  characteristic1: 'Material', characteristic2: 'Diâmetro Tubo', codeFormula: '',
  requiredFields: ['norma', 'material', 'diametro', 'schedule ou espessura', 'origem'], example: '', active: true,
});
const attributes = { norma: 'SA-312', material: '904L', diametro: 'NPS 3"', schedule_ou_espessura: 'SCH 80S', origem: 'N' };

describe('regras V3.11', () => {
  it('mantém Tubo como MP (MPTU) e PI (PITU) com os mesmos campos', () => {
    const mp = tube('Matéria Prima', 'MP', 'MPTU'); const pi = tube('Produto Intermediário', 'PI', 'PITU');
    expect(mp.requiredFields).toEqual(pi.requiredFields);
    expect(structuralPrefix(mp, 'I2', '07')).toBe('MPTUI207');
    expect(structuralPrefix(pi, 'I2', '07')).toBe('PITUI207');
    expect(technicalKey(mp, attributes)).not.toBe(technicalKey(pi, attributes));
    expect(buildDescription(mp, attributes)).toBe('Tubo - SA-312 904L - NPS 3" SCH 80S - N');
  });

  it('gera sequencial de exatamente 6 dígitos e sem dígito verificador', () => {
    expect(composeSequentialCode('MPTUI207', 1)).toBe('MPTUI207000001');
    expect(composeSequentialCode('MPTUI207', 999999)).toBe('MPTUI207999999');
  });

  it('gera Flange Cover pela combinação fixa oficial', () => {
    const result = buildFlangeCover({ modelo: 'EconoGard', material: 'PVC', diametro: '2"', classe: 'ANSI 150#', dreno: 'Sem dreno' });
    expect(result.code).toBe('PAFCEGP4020C10');
    expect(result.code).toHaveLength(14);
  });

  it('aplica validações técnicas de Flange e campos obrigatórios', () => {
    const flange: Category = { ...tube('Matéria Prima', 'MP', 'MPFL'), name: 'Flange', requiredFields: ['tipo','norma do material','material','diametro nominal','face','norma dimensional','classe de pressao','origem'] };
    expect(validateCompatibility(flange, { norma_do_material: 'ASME B16.5', norma_dimensional: 'SA-182', face: 'XX', origem: 'N' })).toContain('norma dimensional');
    expect(missingFields(flange, {})).toHaveLength(8);
  });
});
