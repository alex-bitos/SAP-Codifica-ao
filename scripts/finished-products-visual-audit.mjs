import fs from 'node:fs/promises';
import path from 'node:path';
import * as XLSX from 'xlsx';
import { chromium } from 'playwright';

const baseUrl = process.env.AUDIT_APP_URL;
const password = process.env.AUDIT_TEST_PASSWORD;
if (!baseUrl || !password) throw new Error('Defina AUDIT_APP_URL e AUDIT_TEST_PASSWORD para a homologação isolada.');
const outputDir = path.resolve(process.env.AUDIT_OUTPUT_DIR || path.join('docs', 'screenshots-produtos-acabados'));
await fs.mkdir(outputDir, { recursive: true });

const products = [
  { name: 'Chevron com Alojamento', base: 'PACA', fields: { material: '316L', modulo: '35223184', modelo: '3.1130 visual' } },
  { name: 'Coletor', base: 'PACO', fields: { especificacao: 'Coletor visual' } },
  { name: 'Distribuidores', base: 'PAFL', fields: { especificacao: 'Distribuidor visual' } },
  { name: 'FiberBed', base: 'PAFB', fields: { tipo: 'BD', modelo: 'SingleBed visual', fixacao: 'SRF', material_grade: '316L', material_leito: 'FV', material_fixacoes: '316L' } },
  { name: 'Flange Cover', base: 'PAFC', fields: { modelo: 'EconoGard', material: 'PVC', diametro: '2"', classe: 'ANSI 150#', dreno: 'Sem dreno' } },
  { name: 'Limitadores', base: 'PALM', fields: { especificacao: 'Limitador visual' } },
  { name: 'MaxiMesh', base: 'PAMM', fields: { modelo: '326 visual', geometria: 'Circular', material_malha: '304L', material_grade: '304L', espessura: '1,52', dimensao: '1500' } },
  { name: 'MaxiPac', base: 'PARE', fields: { modelo: '200X visual', material: '316L', diametro: '1500' } },
  { name: 'Recheio Randomico', base: 'PARR', fields: { modelo: 'CMTP visual', dimensao: '25', material: '316L' } },
  { name: 'Suporte', base: 'PASU', fields: { especificacao: 'Suporte visual' } },
  { name: 'Vaso', base: 'PAVA', fields: { especificacao: 'Vaso visual' } },
];

const batchProducts = [
  { Natureza: 'Produto Acabado', Categoria: 'Chevron com Alojamento', Material: '316L', Modulo: '35223184', Modelo: '3.1130 lote visual' },
  { Natureza: 'Produto Acabado', Categoria: 'Coletor', Especificacao: 'Coletor lote visual' },
  { Natureza: 'Produto Acabado', Categoria: 'Distribuidores', Especificacao: 'Distribuidor lote visual' },
  { Natureza: 'Produto Acabado', Categoria: 'FiberBed', Tipo: 'BD', Modelo: 'SingleBed lote visual', Fixacao: 'SRF', 'Material Grade': '316L', 'Material Leito': 'FV', 'Material Fixacoes': '316L' },
  { Natureza: 'Produto Acabado', Categoria: 'Flange Cover', Modelo: 'MetalGard', Material: '316L', Diametro: '4"', Classe: 'ANSI 300#', Dreno: 'Com dreno' },
  { Natureza: 'Produto Acabado', Categoria: 'Limitadores', Especificacao: 'Limitador lote visual' },
  { Natureza: 'Produto Acabado', Categoria: 'MaxiMesh', Modelo: '326 lote visual', Geometria: 'Circular', 'Material Malha': '304L', 'Material Grade': '304L', Espessura: '1,52', Dimensao: '1500' },
  { Natureza: 'Produto Acabado', Categoria: 'MaxiPac', Modelo: '200X lote visual', Material: '316L', Diametro: '1500' },
  { Natureza: 'Produto Acabado', Categoria: 'Recheio Randomico', Modelo: 'CMTP lote visual', Dimensao: '25', Material: '316L' },
  { Natureza: 'Produto Acabado', Categoria: 'Suporte', Especificacao: 'Suporte lote visual' },
  { Natureza: 'Produto Acabado', Categoria: 'Vaso', Especificacao: 'Vaso lote visual' },
];

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1050 }, deviceScaleFactor: 1 });
const browserErrors = [];
page.on('pageerror', (error) => browserErrors.push(error.message));
page.on('response', (response) => { if (response.status() >= 500) browserErrors.push(`${response.status()} ${response.url()}`); });

async function login(loginName) {
  await page.goto(baseUrl, { waitUntil: 'networkidle' });
  await page.locator('#loginForm input[name="login"]').fill(loginName);
  await page.locator('#loginForm input[name="password"]').fill(password);
  await page.locator('#loginForm button[type="submit"]').click();
  await page.locator('#appView:not(.hidden)').waitFor();
  await page.locator('#natureSelect:not([disabled])').waitFor({ timeout: 30_000 });
}

async function selectProduct(name) {
  await page.locator('#categoryFinderText').fill(name);
  const result = page.locator('.category-result').filter({ hasText: 'Produto Acabado' }).filter({ hasText: name }).first();
  await result.waitFor();
  await result.click();
  await page.locator('#dynamicFields input, #dynamicFields select').first().waitFor();
}

async function fillFields(fields) {
  for (const [key, value] of Object.entries(fields)) {
    const input = page.locator(`[name="attribute:${key}"]`);
    if (await input.evaluate((element) => element.tagName === 'SELECT')) await input.selectOption({ label: value });
    else await input.fill(value);
  }
}

const evidence = [];
try {
  await login('audit_admin');
  const initialTotal = await page.evaluate(async () => (await (await fetch('/api/database/status')).json()).counts.codes);
  if (await page.locator('#databaseEmptyWarning').isVisible()) throw new Error('O banco inicializado foi apresentado como vazio.');
  await page.locator('#navigation button[data-view="database"]').click();
  await page.locator('#databaseStatus .metric').first().waitFor();
  await page.screenshot({ path: path.join(outputDir, '01-indicador-banco.png'), fullPage: true });
  const databaseStatus = await page.locator('#databaseStatus').innerText();

  await page.locator('#databaseFile').setInputFiles(path.resolve('Banco_de_Dados_Codigos_SAP_rev3_Consolidado_Flange_Cover.xlsx'));
  await page.locator('#validateDatabase').click();
  await page.locator('#importReport').getByText('Arquivo:', { exact: false }).waitFor({ timeout: 30_000 });
  const importPreview = await page.locator('#importReport').innerText();
  if (!importPreview.includes('0 inclusão(ões)')) throw new Error('A reimportação não apresentou zero inclusões.');

  await page.locator('#navigation button[data-view="generate"]').click();
  for (const product of products) {
    await selectProduct(product.name);
    const labels = await page.locator('#dynamicFields label').allTextContents();
    await fillFields(product.fields);
    await page.locator('#previewButton').click();
    await page.locator('#previewCard:not(.hidden)').waitFor();
    const previewCode = (await page.locator('#previewCode').textContent()) || '';
    const description = (await page.locator('#previewDescription').textContent()) || '';
    if (!previewCode.startsWith(product.base) || previewCode.length !== 14) throw new Error(`${product.name}: código inválido ${previewCode}`);
    if (description.includes('<')) throw new Error(`${product.name}: descrição contém placeholder.`);
    await page.locator('#confirmButton').click();
    await page.locator('#confirmDialog[open]').waitFor();
    await page.locator('#dialogConfirm').click();
    await page.locator('#generateMessage').getByText('gravado no banco central', { exact: false }).waitFor({ timeout: 30_000 });
    const stored = (await page.locator('#previewCode').textContent()) || '';
    evidence.push({ category: product.name, baseCode: product.base, fields: labels.map((label) => label.trim()), code: stored, description, persisted: true, duplicateBlocked: false });
    if (product.name === 'MaxiMesh') await page.screenshot({ path: path.join(outputDir, '02-maximesh-gravado.png'), fullPage: true });
  }

  const maxiMesh = products.find((product) => product.name === 'MaxiMesh');
  await selectProduct(maxiMesh.name);
  await fillFields(maxiMesh.fields);
  await page.locator('#previewButton').click();
  await page.locator('#generateMessage').getByText('já cadastrado', { exact: false }).waitFor();
  evidence.find((item) => item.category === 'MaxiMesh').duplicateBlocked = true;

  await page.locator('#navigation button[data-view="batch"]').click();
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(batchProducts), 'Itens');
  const batchBuffer = Buffer.from(XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }));
  await page.locator('#batchFile').setInputFiles({ name: 'produtos-acabados-lote.xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', buffer: batchBuffer });
  await page.locator('#validateBatch').click();
  await page.locator('#batchBody tr').nth(10).waitFor({ timeout: 30_000 });
  if (await page.locator('#batchBody tr.error-row').count()) throw new Error('A validação em lote encontrou Produtos Acabados inválidos.');
  page.once('dialog', (dialog) => dialog.accept());
  await page.locator('#confirmBatch').click();
  await page.locator('#batchMessage').getByText('11 código(s) gravado(s)', { exact: false }).waitFor({ timeout: 30_000 });
  await page.screenshot({ path: path.join(outputDir, '03-lote-produtos-acabados.png'), fullPage: true });

  await page.locator('#logoutButton').click();
  await page.locator('#loginView:not(.hidden)').waitFor();
  await login('audit_coder');
  await page.locator('#navigation button[data-view="codes"]').click();
  await page.locator('#codesBody tr').first().waitFor();
  const totalText = (await page.locator('#pageInfo').textContent()) || '';
  const sharedTotal = Number(totalText.match(/\d+(?= registro)/)?.[0] || 0);
  if (sharedTotal !== initialTotal + 22) throw new Error(`Segundo usuário recebeu ${sharedTotal} códigos; esperados ${initialTotal + 22}.`);
  await page.screenshot({ path: path.join(outputDir, '04-segundo-usuario.png'), fullPage: true });

  if (browserErrors.length) throw new Error(`Erros no navegador: ${browserErrors.join(' | ')}`);
  await fs.writeFile(path.join(outputDir, 'evidence.json'), `${JSON.stringify({ ok: true, databaseStatus, importPreview, individual: evidence, batch: { rows: 11, persisted: true }, sharedTotal }, null, 2)}\n`, 'utf8');
  console.log(JSON.stringify({ ok: true, individual: evidence, batch: { rows: 11, persisted: true }, sharedTotal, outputDir }, null, 2));
} finally {
  await browser.close();
}
