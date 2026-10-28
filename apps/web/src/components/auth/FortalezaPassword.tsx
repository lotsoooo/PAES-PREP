import { MIN_PASSWORD_LENGTH } from '@paes-pro/shared';
import { Icono } from '@/components/ui/Icono';
import { cn } from '@/lib/cn';
import { evaluarPassword } from './fortaleza';

const NIVELES = [
  { texto: 'Muy débil', barra: 'bg-error', texto2: 'text-error' },
  { texto: 'Débil', barra: 'bg-error', texto2: 'text-error' },
  { texto: 'Aceptable', barra: 'bg-tertiary-container', texto2: 'text-on-surface-variant' },
  { texto: 'Buena', barra: 'bg-success', texto2: 'text-success' },
  { texto: 'Excelente', barra: 'bg-success', texto2: 'text-success' },
];

/** Medidor de fortaleza en vivo + reglas con ícono (el color nunca va solo). */
export function FortalezaPassword({ password }: { password: string }) {
  const { puntaje, reglas } = evaluarPassword(password);
  const nivel = NIVELES[puntaje]!;
  if (!password) return null;
  return (
    <div className="-mt-2 mb-1" aria-live="polite">
      <div className="flex items-center gap-3">
        <div className="grid flex-1 grid-cols-4 gap-1" aria-hidden="true">
          {[1, 2, 3, 4].map((i) => (
            <span key={i} className={cn('h-1.5 rounded-full transition-colors duration-200', i <= puntaje ? nivel.barra : 'bg-surface-container-high')} />
          ))}
        </div>
        <span className={cn('min-w-20 text-right text-caption font-medium', nivel.texto2)}>{nivel.texto}</span>
      </div>
      <ul className="mt-2 grid gap-1 sm:grid-cols-2">
        {[
          { ok: reglas.largo, texto: `${MIN_PASSWORD_LENGTH} caracteres o más` },
          { ok: reglas.mayusMinus, texto: 'Mayúsculas y minúsculas' },
          { ok: reglas.numero, texto: 'Al menos un número' },
          { ok: reglas.simbolo, texto: 'Un símbolo (!, #, $…)' },
        ].map((r) => (
          <li key={r.texto} className={cn('flex items-center gap-1.5 text-caption', r.ok ? 'text-success' : 'text-on-surface-variant')}>
            <Icono nombre={r.ok ? 'check_circle' : 'radio_button_unchecked'} className="text-base" />
            {r.texto}
            <span className="sr-only">{r.ok ? '(cumplido)' : '(pendiente)'}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
