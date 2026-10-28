import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { simularEnsayo } from './fixtures/ensayo';

test('ensayo con API simulada: 65 respuestas, corte de red, recarga y entrega', async ({ page }, info) => {
  const estado = await simularEnsayo(page);
  await page.goto('/app/ensayos/m1-qa/rendir');
  await expect(page.getByText('Pregunta 1 de 65', { exact: true })).toBeVisible();
  await expect(page.locator('.katex').first()).toBeVisible();
  await page.keyboard.press('a');
  await page.keyboard.press('m');
  await expect.poll(() => estado.intento.preguntas[0]?.respuestaActual?.esMarcada).toBe(true);
  estado.sinRed = true;
  await page.keyboard.press('b');
  await expect(page.getByRole('button', { name: 'Reintentar guardado' })).toBeVisible();
  page.on('dialog', (dialog) => dialog.accept());
  await page.reload();
  await expect(page.getByRole('radio').nth(1)).toHaveAttribute('aria-checked', 'true');
  await expect(page.getByRole('button', { name: 'Marcada para revisar', exact: true })).toHaveAttribute('aria-pressed', 'true');
  estado.sinRed = false;
  await page.getByRole('button', { name: 'Reintentar guardado' }).click();
  await expect.poll(() => estado.intento.preguntas[0]?.respuestaActual?.alternativaId).toBe(estado.intento.preguntas[0]!.alternativas[1]!.id);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  if (info.project.name === 'escritorio') {
    for (const width of [375, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `ensayo ${width}px`).toBe(true);
    }
  }
  await page.screenshot({ path: `e2e/capturas/ensayo-fixture-${info.project.name}.png`, fullPage: true });
  const auditoria = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
  expect(auditoria.violations.map((v) => ({ id: v.id, targets: v.nodes.map((n) => n.target) }))).toEqual([]);
  for (let i = 0; i < 65; i++) {
    await page.getByRole('radio').first().click();
    if (i < 64) await page.getByRole('button', { name: 'Siguiente', exact: true }).click();
  }
  await page.getByRole('button', { name: 'Finalizar', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('Respondiste todas las preguntas');
  await page.getByRole('button', { name: 'Entregar ensayo', exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/app/ensayos/intentos/${estado.intento.id}$`));
  expect(estado.entregas).toBe(1);
  expect(estado.intento.preguntas.every((p) => p.respuestaActual?.alternativaId)).toBe(true);
  expect(await page.evaluate((id) => localStorage.getItem(`paes-pro:autoguardado:v1:${id}`), estado.intento.id)).toBeNull();
  expect(estado.inesperadas).toEqual([]);
});

test('ensayo con API simulada: el reloj termina y entrega una sola vez', async ({ page }) => {
  const estado = await simularEnsayo(page, 3);
  await page.goto('/app/ensayos/m1-qa/rendir');
  await expect(page).toHaveURL(new RegExp(`/app/ensayos/intentos/${estado.intento.id}$`));
  expect(estado.entregas).toBe(1);
  expect(estado.intento.estado).toBe('expirado');
  expect(estado.inesperadas).toEqual([]);
});
