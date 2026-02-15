---
name: playwright
description: Use Playwright to debug the running dev server — take screenshots, read rendered text, check console errors, test interactions, inspect the DOM. Use proactively when making frontend changes to verify they work.
---

# Playwright Debugging

Use Playwright to interact with and inspect the running Vite dev server.

## Quick screenshot

```bash
node /workspace/workspace-image-generation/.claude/skills/playwright/take-screenshot.mjs "$URL" "/tmp/screenshot.png"
```

- First argument: URL (default: `http://localhost:5173`)
- Second argument: output path (default: `/tmp/screenshot.png`)

Then use the Read tool to view the resulting PNG.

## Custom scripts

For anything beyond a simple screenshot, write a one-off `.mjs` script to `/tmp/` and run it. Playwright can do everything browser DevTools can:

- **Screenshots** — `page.screenshot()` to visually verify changes
- **Read rendered text** — `page.textContent('.selector')`, `page.innerText()` to verify data binding, filtering, routing
- **Console errors** — `page.on('console', msg => ...)` and `page.on('pageerror', err => ...)` to catch JS exceptions
- **Test interactions** — `page.click()`, `page.fill()`, `page.selectOption()` to verify UI behavior
- **Inspect the DOM** — `page.locator('.selector').count()`, `.getAttribute()`, `.isVisible()` to check element state
- **Network** — `page.on('response', ...)`, `page.route()` to inspect or intercept requests
- **Evaluate JS** — `page.evaluate(() => ...)` to run arbitrary code in the browser context

### Template

```javascript
import { chromium } from '/home/node/.npm/_npx/e41f203b7505f1fb/node_modules/playwright/index.mjs';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

page.on('console', msg => { if (msg.type() === 'error') console.log('CONSOLE ERROR:', msg.text()); });
page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });

// --- your debugging logic here ---

await page.screenshot({ path: '/tmp/screenshot.png' });
await browser.close();
```

Save to `/tmp/debug.mjs` and run with `node /tmp/debug.mjs`.

## Important

- The dev server must already be running (`npm run dev`)
- Playwright import path: `/home/node/.npm/_npx/e41f203b7505f1fb/node_modules/playwright/index.mjs`
- Always use the Read tool to view screenshot PNGs after capturing
