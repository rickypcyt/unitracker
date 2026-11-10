import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const browser = await chromium.launch({
  executablePath: 'C:/Users/ricar/AppData/Local/ms-playwright/chromium-1194/chrome-win/chrome.exe',
});
const page = await browser.newPage({
  viewport: { width: 1200, height: 630 },
  deviceScaleFactor: 2,
});
await page.goto(`file:///${path.join(root, 'scripts/banner.html').replace(/\\/g, '/')}`);
await page.waitForTimeout(300);
await page.screenshot({ path: path.join(root, 'docs/banner.png') });
await browser.close();
console.log('Saved docs/banner.png');
