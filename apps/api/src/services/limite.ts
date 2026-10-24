import { HttpError } from '../http/errores.js';

/**
 * Limitador en memoria por clave (ventana fija). Suficiente para una sola
 * instancia; con varias réplicas se reemplaza por Redis o una tabla.
 */
const ventanas = new Map<string, { inicio: number; cuenta: number }>();

export function limitarIntentos(clave: string, maximo: number, minutos: number): void {
  const ahora = Date.now();
  const ventana = ventanas.get(clave);
  if (!ventana || ahora - ventana.inicio > minutos * 60_000) {
    ventanas.set(clave, { inicio: ahora, cuenta: 1 });
    return;
  }
  ventana.cuenta += 1;
  if (ventana.cuenta > maximo) {
    const espera = Math.ceil((ventana.inicio + minutos * 60_000 - ahora) / 1000);
    throw new HttpError(
      429,
      'RATE_LIMITED',
      `Demasiados intentos. Espera ${espera} segundos y vuelve a intentarlo.`,
      { reintentarEn: espera },
    );
  }
}

// Limpieza periódica para que el mapa no crezca sin límite.
setInterval(() => {
  const ahora = Date.now();
  for (const [clave, v] of ventanas) {
    if (ahora - v.inicio > 60 * 60_000) ventanas.delete(clave);
  }
}, 10 * 60_000).unref?.();
