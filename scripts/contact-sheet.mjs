// Builds one contact-sheet PNG per viewport from the files in screenshots/.
import { chromium } from 'playwright';
import { readdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const browser = await chromium.launch();
for (const dir of (await readdir('screenshots', { withFileTypes: true })).filter((d) => d.isDirectory())) {
  const files = (await readdir(`screenshots/${dir.name}`)).filter((f) => f.endsWith('.png')).sort();
  const html = `<body style="margin:0;background:#000;display:grid;grid-template-columns:repeat(3,1fr);gap:6px;padding:6px">
    ${files.map((f) => `<figure style="margin:0"><img src="file://${resolve('screenshots', dir.name, f)}" style="width:100%;display:block"><figcaption style="color:#999;font:14px system-ui;padding:4px">${f}</figcaption></figure>`).join('')}</body>`;
  const tmp = resolve('screenshots', `${dir.name}.html`);
  await writeFile(tmp, html);
  const page = await browser.newPage({ viewport: { width: 2400, height: 1000 } });
  await page.goto(`file://${tmp}`);
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: `screenshots/sheet-${dir.name}.png`, fullPage: true });
  await page.close();
  console.log(`screenshots/sheet-${dir.name}.png (${files.length} images)`);
}
await browser.close();
