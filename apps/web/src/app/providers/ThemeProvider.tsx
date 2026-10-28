import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { Tema } from '@paes-pro/shared';
import { TemaContext } from './tema';

const CLAVE_ALMACEN = 'paes-pro-tema';

function leerPreferencia(): Tema {
  try {
    const guardada = localStorage.getItem(CLAVE_ALMACEN);
    return guardada === 'claro' || guardada === 'oscuro' || guardada === 'sistema' ? guardada : 'sistema';
  } catch {
    return 'sistema';
  }
}

function resolver(tema: Tema, consultaOscuro: boolean): 'claro' | 'oscuro' {
  if (tema === 'sistema') return consultaOscuro ? 'oscuro' : 'claro';
  return tema;
}

/**
 * Aplica el tema en <html> y lo persiste. La decisión final (preferencia vs.
 * preferencia del sistema) también la toma el script inline de index.html para
 * evitar el parpadeo en el primer pintado.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preferencia, setPreferenciaState] = useState<Tema>(leerPreferencia);
  const [consultaOscuro, setConsultaOscuro] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches,
  );

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const alCambiar = (e: MediaQueryListEvent) => setConsultaOscuro(e.matches);
    mq.addEventListener('change', alCambiar);
    return () => mq.removeEventListener('change', alCambiar);
  }, []);

  const tema = resolver(preferencia, consultaOscuro);

  useEffect(() => {
    const raiz = document.documentElement;
    raiz.classList.toggle('dark', tema === 'oscuro');
    raiz.classList.toggle('light', tema === 'claro');
    try { localStorage.setItem(CLAVE_ALMACEN, preferencia); } catch { /* El tema sigue funcionando en memoria. */ }
    const color = getComputedStyle(raiz).getPropertyValue('--pal-background').trim();
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', color);
  }, [tema, preferencia]);

  const valor = useMemo(
    () => ({
      tema,
      preferencia,
      setPreferencia: (nueva: Tema) => setPreferenciaState(nueva),
    }),
    [tema, preferencia],
  );

  return <TemaContext.Provider value={valor}>{children}</TemaContext.Provider>;
}
