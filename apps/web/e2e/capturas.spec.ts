import { expect, test, type ConsoleMessage, type Page } from '@playwright/test';

/**
 * Capturas de cada pantalla (1440 y 390 px) para compararlas con el
 * `screen.png` de Stitch indicado. Falla si la consola registra errores.
 */
const EMAIL = process.env.E2E_EMAIL ?? 'valentina.perez@demo.cl';
const PASSWORD = process.env.E2E_PASSWORD ?? 'Demo1234!';

const PUBLICAS: [string, string][] = [
  ['landing', '/'],
  ['login', '/login'],
  ['registro', '/registro'],
  ['recuperar', '/recuperar'],
];

const PRIVADAS: [string, string][] = [
  ['dashboard', '/app'],
  ['plan', '/app/plan'],
  ['contenidos', '/app/contenidos'],
  ['leccion', '/app/contenidos/factorizacion-por-agrupacion'],
  ['ensayos', '/app/ensayos'],
  ['detalle-ensayo', '/app/ensayos/ensayo-diagnostico-m1'],
  ['repaso', '/app/repaso'],
  ['estadisticas', '/app/estadisticas'],
  ['comunidad', '/app/comunidad'],
  ['crear-publicacion', '/app/comunidad/nuevo'],
  ['buscar-comunidad', '/app/comunidad/buscar?q=funciones'],
  ['perfil', '/app/perfil'],
  ['notificaciones', '/app/notificaciones'],
  ['configuracion', '/app/configuracion/cuenta'],
  ['apariencia', '/app/configuracion/apariencia'],
  ['premium', '/app/premium'],
  ['checkout', '/app/premium/checkout'],
  ['ayuda', '/app/ayuda'],
  ['onboarding-meta', '/onboarding/meta'],
  ['no-encontrada', '/app/no-existe'],
];

function vigilarConsola(page: Page): string[] {
  const errores: string[] = [];
  page.on('console', (m: ConsoleMessage) => {
    if (m.type() === 'error') errores.push(m.text());
  });
  page.on('pageerror', (e) => errores.push(e.message));
  return errores;
}

async function capturar(page: Page, nombre: string, proyecto: string) {
  await page.waitForLoadState('networkidle');
  // Las animaciones de entrada duran < 400 ms.
  await page.waitForTimeout(600);
  await page.screenshot({ path: `e2e/capturas/${nombre}-${proyecto}.png`, fullPage: true });
}

for (const [nombre, ruta] of PUBLICAS) {
  test(`pública: ${nombre}`, async ({ page }, info) => {
    const errores = vigilarConsola(page);
    await page.goto(ruta);
    await capturar(page, nombre, info.project.name);
    expect(errores).toEqual([]);
  });
}

test.describe('con sesión', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/correo/i).fill(EMAIL);
    await page.getByLabel(/^contraseña/i).fill(PASSWORD);
    await page.getByRole('button', { name: /iniciar sesión|ingresar/i }).click();
    await page.waitForURL(/\/(app|onboarding)/);
  });

  for (const [nombre, ruta] of PRIVADAS) {
    test(`privada: ${nombre}`, async ({ page }, info) => {
      const errores = vigilarConsola(page);
      await page.goto(ruta);
      await capturar(page, nombre, info.project.name);
      expect(errores).toEqual([]);
    });
  }
});
