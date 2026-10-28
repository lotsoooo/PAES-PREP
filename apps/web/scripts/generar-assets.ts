/** Rasteriza la marca SVG del repositorio, sin imágenes ni fuentes externas. */
import { chromium } from '@playwright/test';
import { mkdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const publico = fileURLToPath(new URL('../public/', import.meta.url));
const logo = await readFile(`${publico}/favicon.svg`, 'utf8');
await mkdir(`${publico}/icons`, { recursive: true });
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ deviceScaleFactor: 1 });
  for (const size of [192, 512]) {
    await page.setViewportSize({ width: size, height: size });
    await page.setContent(`<style>body{margin:0}svg{display:block;width:100vw;height:100vh}</style>${logo}`);
    await page.screenshot({ path: `${publico}/icons/icon-${size}.png`, omitBackground: true });
  }
  await page.setContent(`<style>body{margin:0;background:#003fb1;height:100vh;display:grid;place-items:center}svg{width:70vw;height:70vh}</style>${logo}`);
  await page.screenshot({ path: `${publico}/icons/icon-512-maskable.png` });
  await page.setViewportSize({ width: 1200, height: 630 });
  await page.setContent(`<style>body{margin:0;padding:80px;box-sizing:border-box;background:#f9f9ff;color:#141b2b;font-family:Arial,sans-serif}svg{width:88px;height:88px}h1{font-size:76px;margin:30px 0 16px;color:#003fb1}p{font-size:32px;max-width:850px;line-height:1.4;margin:0}</style>${logo}<h1>PAES Pro</h1><p>Ensaya, revisa tus errores y organiza tu preparación para la PAES.</p>`);
  await page.screenshot({ path: `${publico}/og-image.png` });
} finally {
  await browser.close();
}
