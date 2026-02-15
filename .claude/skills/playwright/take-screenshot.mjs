import { chromium } from '/home/node/.npm/_npx/e41f203b7505f1fb/node_modules/playwright/index.mjs';

const url = process.argv[2] || 'http://localhost:5173';
const output = process.argv[3] || '/tmp/screenshot.png';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
await page.goto(url, { waitUntil: 'networkidle' });
await page.screenshot({ path: output });
await browser.close();
console.log(output);
