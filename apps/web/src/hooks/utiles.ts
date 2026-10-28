import { useEffect, useRef, useState } from 'react';

/** Valor que solo cambia tras `ms` sin cambios (búsquedas con debounce). */
export function useDebounce<T>(valor: T, ms = 250): T {
  const [retrasado, setRetrasado] = useState(valor);
  useEffect(() => {
    const t = setTimeout(() => setRetrasado(valor), ms);
    return () => clearTimeout(t);
  }, [valor, ms]);
  return retrasado;
}

/** Título del documento: "Sección · PAES Pro". */
export function useTitulo(titulo: string | null | undefined): void {
  useEffect(() => {
    if (!titulo) return;
    const anterior = document.title;
    document.title = `${titulo} · PAES Pro`;
    return () => {
      document.title = anterior;
    };
  }, [titulo]);
}

/** true si el usuario pidió reducir el movimiento. */
export function usePrefiereMenosMovimiento(): boolean {
  const [reducido, setReducido] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const alCambiar = (e: MediaQueryListEvent) => setReducido(e.matches);
    mq.addEventListener('change', alCambiar);
    return () => mq.removeEventListener('change', alCambiar);
  }, []);
  return reducido;
}

/**
 * Anima un número de 0 al valor final cuando entra en pantalla (o al cambiar).
 * Con movimiento reducido muestra el valor final de inmediato.
 */
export function useContador(final: number, duracionMs = 900): [number, React.RefObject<HTMLElement | null>] {
  const ref = useRef<HTMLElement | null>(null);
  const reducido = usePrefiereMenosMovimiento();
  const [valor, setValor] = useState(reducido ? final : 0);

  useEffect(() => {
    if (reducido) {
      setValor(final);
      return;
    }
    const el = ref.current;
    let raf = 0;
    const animar = () => {
      const inicio = performance.now();
      const paso = (t: number) => {
        const p = Math.min(1, (t - inicio) / duracionMs);
        const suavizado = 1 - Math.pow(1 - p, 3);
        setValor(Math.round(final * suavizado));
        if (p < 1) raf = requestAnimationFrame(paso);
      };
      raf = requestAnimationFrame(paso);
    };
    if (!el || typeof IntersectionObserver === 'undefined') {
      animar();
      return () => cancelAnimationFrame(raf);
    }
    const obs = new IntersectionObserver(
      (entradas) => {
        if (entradas.some((e) => e.isIntersecting)) {
          obs.disconnect();
          animar();
        }
      },
      { threshold: 0.3 },
    );
    obs.observe(el);
    return () => {
      obs.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [final, duracionMs, reducido]);

  return [valor, ref];
}

/** Atajo de teclado global (ignora cuando se escribe en un campo, salvo `enCampos`). */
export function useAtajo(
  tecla: string,
  accion: (e: KeyboardEvent) => void,
  opciones: { ctrl?: boolean; enCampos?: boolean; activo?: boolean } = {},
): void {
  const ref = useRef(accion);
  ref.current = accion;
  const { ctrl, enCampos, activo = true } = opciones;
  useEffect(() => {
    if (!activo) return;
    function alPresionar(e: KeyboardEvent) {
      const objetivo = e.target as HTMLElement | null;
      const escribiendo =
        objetivo && (objetivo.tagName === 'INPUT' || objetivo.tagName === 'TEXTAREA' || objetivo.isContentEditable);
      if (escribiendo && !enCampos) return;
      if (ctrl && !(e.ctrlKey || e.metaKey)) return;
      if (!ctrl && (e.ctrlKey || e.metaKey || e.altKey)) return;
      if (e.key.toLowerCase() === tecla.toLowerCase()) ref.current(e);
    }
    window.addEventListener('keydown', alPresionar);
    return () => window.removeEventListener('keydown', alPresionar);
  }, [tecla, ctrl, enCampos, activo]);
}
