import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { BRAND_NAME } from '@/config/marca';
import { MarcaIcono } from '@/components/marca/Logo';
import { Icono } from '@/components/ui/Icono';
import { cn } from '@/lib/cn';

/**
 * Marco de las pantallas de acceso (Stitch: card blanca centrada de ~560px
 * sobre el fondo surface, marca arriba). Un solo h1 por pantalla.
 */
export function MarcoAuth({
  titulo,
  descripcion,
  children,
  pie,
  ancho = 'md',
}: {
  titulo: string;
  descripcion?: ReactNode;
  children: ReactNode;
  pie?: ReactNode;
  ancho?: 'md' | 'lg';
}) {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <a href="#contenido" className="saltar-contenido">Saltar al contenido</a>
      <header className="mx-auto flex w-full max-w-[1280px] items-center justify-between px-4 py-5 md:px-12">
        <Link to="/" className="flex items-center gap-2 rounded" aria-label={`${BRAND_NAME}, ir al inicio`}>
          <MarcaIcono className="size-8" />
          <span className="text-body-lg font-bold text-primary" translate="no">
            {BRAND_NAME}
          </span>
        </Link>
        <Link
          to="/"
          className="inline-flex min-h-11 items-center gap-1 rounded px-2 text-label-md text-on-surface-variant transition-colors hover:text-primary"
        >
          <Icono nombre="arrow_back" className="text-lg" />
          Volver al inicio
        </Link>
      </header>
      <main id="contenido" className="flex flex-1 items-start justify-center px-4 pb-12 pt-4 md:items-center md:pt-0">
        <div
          className={cn(
            'animar-entrada w-full rounded-lg border border-border bg-surface-container-lowest p-6 shadow-card sm:p-10',
            ancho === 'lg' ? 'max-w-[640px]' : 'max-w-[480px]',
          )}
        >
          <div className="mb-8 text-center">
            <h1 className="text-headline-lg-mobile text-on-surface text-balance md:text-headline-lg">{titulo}</h1>
            {descripcion && <p className="mt-2 text-body-md text-on-surface-variant text-pretty">{descripcion}</p>}
          </div>
          {children}
          {pie && <div className="mt-8 border-t border-border pt-6 text-center text-body-md text-on-surface-variant">{pie}</div>}
        </div>
      </main>
    </div>
  );
}

/** Banner de error del formulario (variante "con colegio" de Stitch). */
export function BannerError({ mensaje, className }: { mensaje: string | null; className?: string }) {
  if (!mensaje) return null;
  return (
    <div
      role="alert"
      className={cn('mb-6 flex items-start gap-3 rounded border border-error/30 bg-error-container px-4 py-3 text-on-error-container', className)}
    >
      <Icono nombre="error" relleno className="mt-0.5 text-xl text-error" />
      <p className="text-label-md">{mensaje}</p>
    </div>
  );
}

/** Divisor "o" entre el acceso con Google y el formulario. */
export function DivisorO() {
  return (
    <div className="my-6 flex items-center gap-4" role="separator" aria-label="o">
      <span className="h-px flex-1 bg-border" />
      <span className="text-caption text-on-surface-variant">o</span>
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}

/** Botón "Continuar con Google" (redirige al flujo OAuth del API). */
export function BotonGoogle({ href }: { href: string }) {
  return (
    <a
      href={href}
      className="flex min-h-12 w-full items-center justify-center gap-3 rounded border border-border-strong bg-surface-container-lowest px-4 text-label-md font-semibold text-on-surface transition-colors hover:bg-surface-container-low"
    >
      <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
        <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.2-2.1 3.5-5.1 3.5-8.8Z" />
        <path fill="#34A853" d="M12 24c3.2 0 6-1.1 7.9-2.9l-3.9-3c-1 .7-2.4 1.2-4 1.2-3.1 0-5.7-2.1-6.6-4.9h-4v3.1A12 12 0 0 0 12 24Z" />
        <path fill="#FBBC05" d="M5.4 14.4a7.2 7.2 0 0 1 0-4.7V6.6h-4a12 12 0 0 0 0 10.9l4-3.1Z" />
        <path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.4 6.6l4 3.1C6.3 6.9 8.9 4.8 12 4.8Z" />
      </svg>
      Continuar con Google
    </a>
  );
}
