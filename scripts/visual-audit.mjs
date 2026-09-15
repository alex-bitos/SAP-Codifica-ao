import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const baseUrl = process.env.AUDIT_APP_URL;
const password = process.env.AUDIT_TEST_PASSWORD;
if (!baseUrl || !password) throw new Error('Defina AUDIT_APP_URL e AUDIT_TEST_PASSWORD para a homologação isolada.');
const outputDir = path.resolve(process.env.AUDIT_OUTPUT_DIR || path.join('docs', 'screenshots-v311'));
await fs.mkdir(outputDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1050 }, deviceScaleFactor: 1 });
page.on('pageerror', (error) => console.error('PAGE_ERROR', error.message));
page.on('console', (message) => { if (message.type() === 'error') console.error('BROWSER_CONSOLE', message.text()); });
const evidence = [];
const shot = async (name, description) => {
  const file = path.join(outputDir, name);
  await page.screenshot({ path: file, fullPage: true });
  evidence.push({ file: name, description });
};
const login = async (loginName) => {
  await page.goto(baseUrl, { waitUntil: 'networkidle' });
  await page.locator('#loginForm input[name="login"]').fill(loginName);
  await page.locator('#loginForm input[name="password"]').fill(password);
  await page.locator('#loginForm button[type="submit"]').click();
  try { await page.locator('#appView:not(.hidden)').waitFor(); }
  catch (error) {
    console.error('LOGIN_STATE', JSON.stringify({ loginName, message: await page.locator('#loginMessage').textContent(), appClass: await page.locator('#appView').getAttribute('class') }));
    throw error;
  }
  try { await page.locator('#natureSelect:not([disabled])').waitFor({ timeout: 30_000 }); }
  catch (error) {
    console.error('CATALOG_STATE', JSON.stringify({ catalogErrorVisible: await page.locator('#catalogError').isVisible(), connection: await page.locator('#connection').textContent(), natureDisabled: await page.locator('#natureSelect').isDisabled() }));
    throw error;
  }
  if (await page.locator('#catalogError').isVisible()) throw new Error('O erro de catálogos permaneceu visível após o carregamento inicial.');
};
const quickSelect = async (query, nature) => {
  await page.locator('#categoryFinderText').fill(query);
  const result = page.locator('.category-result').filter({ hasText: nature }).first();
  await result.waitFor();
  await result.click();
  await page.locator('#dynamicFields input, #dynamicFields select').first().waitFor();
};

try {
  await login('audit_admin');
  if ((await page.locator('#dynamicFields input, #dynamicFields select').count()) !== 0) throw new Error('A tela inicial exibiu campos antes da categoria.');
  await page.getByText('Selecione uma categoria.', { exact: true }).waitFor();
  await shot('01-tela-inicial.png', 'Tela inicial sem campos indevidos antes da categoria.');

  await page.locator('#categoryFinderText').fill('Tubo');
  await page.locator('.category-result').first().waitFor();
  await shot('02-busca-rapida.png', 'Busca rápida preenchida com Tubo.');
  if ((await page.locator('.category-result').count()) < 2) throw new Error('A busca de Tubo não retornou as naturezas MP e PI.');
  await shot('03-resultados-busca.png', 'Resultados mostram categoria e natureza, incluindo Tubo MP e PI.');

  await page.locator('.category-result').filter({ hasText: 'Matéria Prima' }).first().click();
  await page.locator('#dynamicFields input, #dynamicFields select').first().waitFor();
  const tubeLabels = await page.locator('#dynamicFields label').allTextContents();
  for (const expected of ['norma', 'material', 'diametro', 'schedule ou espessura', 'origem']) if (!tubeLabels.some((label) => label.toLowerCase().includes(expected))) throw new Error(`Campo de Tubo ausente: ${expected}`);
  await shot('04-tubo-materia-prima.png', 'Tubo MP selecionado com somente os campos oficiais.');

  await quickSelect('Chapa', 'Matéria Prima');
  const chapaLabels = (await page.locator('#dynamicFields label').allTextContents()).join('|').toLowerCase();
  for (const expected of ['norma', 'material', 'espessura', 'largura', 'comprimento', 'acabamento', 'origem']) if (!chapaLabels.includes(expected)) throw new Error(`Campo de Chapa ausente: ${expected}`);
  await shot('05-chapa.png', 'Chapa selecionada com sete campos oficiais.');

  await quickSelect('Flange', 'Matéria Prima');
  const flangeLabels = (await page.locator('#dynamicFields label').allTextContents()).join('|').toLowerCase();
  for (const expected of ['tipo', 'norma do material', 'material', 'diametro nominal', 'face', 'norma dimensional', 'classe de pressao', 'origem']) {
    const normalized = flangeLabels.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (!normalized.includes(expected)) throw new Error(`Campo de Flange ausente: ${expected}`);
  }
  await shot('06-flange.png', 'Flange selecionado com campos separados e opções oficiais.');

  await page.locator('#categoryFinderText').fill('Instrumento');
  await page.locator('.category-result').first().waitFor();
  await page.locator('.category-result').first().click();
  await page.locator('#dynamicFields input, #dynamicFields select').first().waitFor();
  if ((await page.locator('#dynamicFields label').count()) !== 8) throw new Error('Instrumento não exibiu seus oito campos oficiais.');

  await page.locator('#navigation button[data-view="codes"]').click();
  await page.locator('#codesBody tr').first().waitFor();
  if (Number((await page.locator('#pageInfo').textContent()).match(/\d+(?= registro)/)?.[0] || 0) < 986) throw new Error('Consulta não mostrou os 986 códigos históricos persistidos.');
  await shot('07-codigos-importados.png', 'Consulta dos códigos históricos e dos dois códigos concorrentes.');

  await page.locator('#navigation button[data-view="database"]').click();
  await page.locator('#databaseFile').setInputFiles(path.resolve('Banco_de_Dados_Codigos_SAP_rev3_Consolidado_Flange_Cover.xlsx'));
  await page.locator('#validateDatabase').click();
  await page.locator('#importReport').getByText('Arquivo:', { exact: false }).waitFor({ timeout: 30_000 });
  await shot('08-importacao-administrativa.png', 'Simulação administrativa com abas, existentes, inclusões, bloqueios e duplicidades.');

  await page.locator('#logoutButton').click();
  await page.locator('#loginView:not(.hidden)').waitFor();
  await login('audit_coder');
  await page.locator('#navigation button[data-view="codes"]').click();
  await page.locator('#codesBody tr').first().waitFor();
  if (Number((await page.locator('#pageInfo').textContent()).match(/\d+(?= registro)/)?.[0] || 0) < 986) throw new Error('Segundo usuário não mostrou os códigos históricos persistidos.');
  await shot('09-segundo-usuario.png', 'Segundo usuário consultando o mesmo banco PostgreSQL.');

  await page.locator('#navigation button[data-view="generate"]').click();
  await page.evaluate(async () => {
    const originalFetch = window.fetch.bind(window);
    window.fetch = (input, init) => String(input).includes('/api/natures')
      ? Promise.resolve(new Response('{"error":"indisponível"}', { status: 503, headers: { 'Content-Type': 'application/json' } }))
      : originalFetch(input, init);
    try { await loadCatalogsWithRetry(); } catch (error) { showCatalogError(error); }
  });
  await page.locator('#catalogError:not(.hidden)').waitFor();
  if (!(await page.locator('#natureSelect').isDisabled())) throw new Error('Gerador não foi bloqueado após falha do catálogo.');

  await fs.writeFile(path.join(outputDir, 'evidence.json'), `${JSON.stringify({ ok: true, baseUrl, evidence }, null, 2)}\n`, 'utf8');
  console.log(JSON.stringify({ ok: true, screenshots: evidence.length, outputDir }, null, 2));
} finally {
  await browser.close();
}
