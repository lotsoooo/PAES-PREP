import { useEffect, useRef } from 'react';
import { usePrefiereMenosMovimiento } from '@/hooks/utiles';

/**
 * Confeti discreto (≈1,8 s, 70 piezas) al superar la meta. Toma los colores
 * de los tokens de la marca; con movimiento reducido no se dibuja.
 */
export function Confeti({ activo }: { activo: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const reducido = usePrefiereMenosMovimiento();

  useEffect(() => {
    const canvas = ref.current;
    if (!activo || reducido || !canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const estilos = getComputedStyle(document.documentElement);
    const colores = ['--pal-primary', '--pal-primary-container', '--pal-success', '--pal-secondary-container', '--pal-primary-fixed-dim']
      .map((v) => estilos.getPropertyValue(v).trim())
      .filter(Boolean);
    const dpr = window.devicePixelRatio || 1;
    const ancho = canvas.clientWidth;
    const alto = canvas.clientHeight;
    canvas.width = ancho * dpr;
    canvas.height = alto * dpr;
    ctx.scale(dpr, dpr);

    const piezas = Array.from({ length: 70 }, () => ({
      x: ancho / 2 + (Math.random() - 0.5) * ancho * 0.3,
      y: alto * 0.25,
      vx: (Math.random() - 0.5) * 9,
      vy: -Math.random() * 9 - 3,
      giro: Math.random() * Math.PI,
      vGiro: (Math.random() - 0.5) * 0.3,
      tam: 5 + Math.random() * 5,
      color: colores[Math.floor(Math.random() * colores.length)] ?? 'currentColor',
    }));

    const inicio = performance.now();
    let raf = 0;
    const dibujar = (t: number) => {
      const p = (t - inicio) / 1800;
      ctx.clearRect(0, 0, ancho, alto);
      ctx.globalAlpha = Math.max(0, 1 - p * p);
      for (const pz of piezas) {
        pz.vy += 0.25;
        pz.vx *= 0.99;
        pz.x += pz.vx;
        pz.y += pz.vy;
        pz.giro += pz.vGiro;
        ctx.save();
        ctx.translate(pz.x, pz.y);
        ctx.rotate(pz.giro);
        ctx.fillStyle = pz.color;
        ctx.fillRect(-pz.tam / 2, -pz.tam / 4, pz.tam, pz.tam / 2);
        ctx.restore();
      }
      if (p < 1) raf = requestAnimationFrame(dibujar);
      else ctx.clearRect(0, 0, ancho, alto);
    };
    raf = requestAnimationFrame(dibujar);
    return () => cancelAnimationFrame(raf);
  }, [activo, reducido]);

  if (!activo || reducido) return null;
  return <canvas ref={ref} aria-hidden="true" className="pointer-events-none fixed inset-0 z-50 size-full" />;
}
