import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const baseUrl = process.env.AUDIT_APP_URL;
const password = process.env.AUDIT_TEST_PASSWORD;
const expectedTotal = Number(process.env.AUDIT_EXPECTED_TOTAL);

if (!baseUrl || !password || !Number.isInteger(expectedTotal)) {
  throw new Error('Defina AUDIT_APP_URL, AUDIT_TEST_PASSWORD e AUDIT_EXPECTED_TOTAL.');
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

try {
  await page.goto(baseUrl, { waitUntil: 'networkidle' });
  await page.locator('#loginForm input[name="login"]').fill('audit_coder');
  await page.locator('#loginForm input[name="password"]').fill(password);
  await page.locator('#loginForm button[type="submit"]').click();
  await page.locator('#appView:not(.hidden)').waitFor();
  await page.waitForFunction(() => document.querySelector('#pageInfo')?.textContent?.includes('registro'));

  const pageInfo = (await page.locator('#pageInfo').textContent()) || '';
  const actualTotal = Number(pageInfo.match(/\d+(?= registro)/)?.[0]);
  assert.equal(actualTotal, expectedTotal, 'A contagem após o reinício divergiu do valor persistido.');

  console.log(JSON.stringify({ login: 'audit_coder', expectedTotal, actualTotal, persistedAfterRestart: true }));
} finally {
  await browser.close();
}
