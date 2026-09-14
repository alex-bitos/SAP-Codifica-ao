import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { analyzeWorkbook, importedSequential } from '../src/services/importer.js';

const workbookPath = path.resolve('Banco_de_Dados_Codigos_SAP_rev3_Consolidado_Flange_Cover.xlsx');

describe('simulação da migração Excel consolidada', () => {
  it('valida abas, contagens e códigos históricos sem conflito canônico', () => {
    const result = analyzeWorkbook(fs.readFileSync(workbookPath), path.basename(workbookPath));
    expect(result.valid).toBe(true);
    expect(result.counts).toEqual({ codes: 986, categories: 145, references: 604, history: 5 });
    expect(result.canonicalDuplicates).toHaveLength(0);
    expect(result.fileHash).toMatch(/^[a-f0-9]{64}$/);
    expect(result.rows.Codigos.map((row) => row.CodigoSAP)).toHaveLength(986);
  });

  it('detecta alteração do arquivo pelo hash', () => {
    const original = fs.readFileSync(workbookPath); const changed = Buffer.concat([original, Buffer.from([0])]);
    expect(analyzeWorkbook(original, 'a.xlsx').fileHash).not.toBe(analyzeWorkbook(changed, 'a.xlsx').fileHash);
  });

  it('mantém somente sequenciais operacionais de seis dígitos', () => {
    expect(importedSequential('00000', 'PIIN0000000000')).toBe('');
    expect(importedSequential('123456', 'PIIN0012123456')).toBe('123456');
    expect(importedSequential('', 'PIIN0012654321')).toBe('654321');
  });
});
