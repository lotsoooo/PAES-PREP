import { expect, test } from '@playwright/test';

// Estas pruebas solo leen catálogos públicos. No crean cuentas ni escriben en la BD conectada.
test('visitante: rutas privadas exigen sesión y conservan el destino', async ({ page, request }) => {
  await page.goto('/app/ensayos');
  await expect(page).toHaveURL(/\/login\?volver=%2Fapp%2Fensayos/);
  await expect(page.getByRole('heading', { name: 'Inicia sesión' })).toBeVisible();
  for (const ruta of ['/dashboard', '/intentos/00000000-0000-4000-8000-000000000001', '/premium/estado']) {
    const respuesta = await request.get(`/api/v1${ruta}`);
    expect(respuesta.status(), ruta).toBe(401);
  }
});

test('visitante: validación, foco y visibilidad de contraseña', async ({ page }) => {
  await page.goto('/login');
  const correo = page.getByLabel('Correo electrónico');
  await page.getByRole('button', { name: 'Iniciar sesión', exact: true }).click();
  await expect(correo).toHaveAttribute('aria-invalid', 'true');
  await expect(correo).toBeFocused();
  const password = page.getByLabel('Contraseña', { exact: true });
  await password.fill('Ejemplo-local-123');
  await page.getByRole('button', { name: 'Mostrar contraseña' }).click();
  await expect(password).toHaveAttribute('type', 'text');
  await page.getByRole('button', { name: 'Ocultar contraseña' }).click();
  await expect(password).toHaveAttribute('type', 'password');
});

test('visitante: la app abre aunque el almacenamiento local esté bloqueado', async ({ page }) => {
  const errores: string[] = [];
  page.on('pageerror', (error) => errores.push(error.message));
  await page.addInitScript(() => {
    for (const metodo of ['getItem', 'setItem']) Object.defineProperty(Storage.prototype, metodo, {
      value: () => { throw new DOMException('Almacenamiento bloqueado', 'SecurityError'); },
    });
  });
  await page.goto('/login');
  await expect(page.getByRole('button', { name: 'Iniciar sesión', exact: true })).toBeVisible();
  expect(errores).toEqual([]);
});

test('visitante: preguntas frecuentes por teclado y navegación al registro', async ({ page }) => {
  await page.goto('/');
  const pregunta = page.getByRole('button', { name: '¿El puntaje estimado es el oficial?' });
  await pregunta.focus();
  await page.keyboard.press('Enter');
  await expect(pregunta).toHaveAttribute('aria-expanded', 'true');
  await expect(page.getByText('No. Es una aproximación', { exact: false })).toBeVisible();
  await page.keyboard.press('Enter');
  await expect(pregunta).toHaveAttribute('aria-expanded', 'false');
  await page.getByRole('link', { name: 'Comenzar ahora' }).first().click();
  await expect(page.getByRole('heading', { name: 'Crea tu cuenta' })).toBeVisible();
});

test('visitante: responsive y contraste de la acción principal en ambos temas', async ({ page }) => {
  for (const tema of ['claro', 'oscuro']) {
    await page.addInitScript((valor) => localStorage.setItem('paes-pro-tema', valor), tema);
    for (const width of [375, 390, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/login');
      const boton = page.getByRole('button', { name: 'Iniciar sesión', exact: true });
      await expect(boton).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${tema} ${width}px`).toBe(true);
      const contraste = await boton.evaluate((elemento) => {
        const estilo = getComputedStyle(elemento);
        const luminancia = (color: string) => {
          const canales = (color.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number).map((v) => {
            const n = v / 255;
            return n <= 0.04045 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4;
          });
          return canales[0]! * 0.2126 + canales[1]! * 0.7152 + canales[2]! * 0.0722;
        };
        const a = luminancia(estilo.color), b = luminancia(estilo.backgroundColor);
        return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
      });
      expect(contraste, `${tema} ${width}px`).toBeGreaterThanOrEqual(4.5);
    }
  }
});
