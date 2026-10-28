import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

for (const tema of ['claro', 'oscuro']) {
  for (const ruta of ['/', '/login', '/registro', '/recuperar']) {
    test(`accesibilidad pública ${ruta} ${tema}`, async ({ page }, info) => {
      await page.addInitScript((valor) => localStorage.setItem('paes-pro-tema', valor), tema);
      await page.goto(ruta);
      await page.waitForLoadState('networkidle');
      await page.evaluate(() => document.fonts.ready);
      const resultado = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
      await info.attach('auditoria-axe.json', { body: JSON.stringify(resultado, null, 2), contentType: 'application/json' });
      expect(resultado.violations.map((v) => ({ regla: v.id, impacto: v.impact, nodos: v.nodes.map((n) => ({ selector: n.target, motivo: n.failureSummary })) }))).toEqual([]);
    });
  }
}
