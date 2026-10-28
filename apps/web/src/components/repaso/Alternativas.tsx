import type { DTOAlternativa } from '@paes-pro/shared';
import { cn } from '@/lib/cn';
import { Icono } from '@/components/ui/Icono';
import { TextoMat } from '@/components/contenido/TextoMat';

const LETRAS = ['A', 'B', 'C', 'D', 'E'];

export interface PropsAlternativas {
  nombre: string;
  leyenda: string;
  alternativas: DTOAlternativa[];
  seleccionada: string | null;
  onSeleccionar: (id: string) => void;
  /** Tras corregir: la correcta en verde y la elegida (si falló) en rojo, con ícono y texto. */
  correccion?: { correctaId: string } | null;
  deshabilitado?: boolean;
}

/**
 * Alternativas A–D/E como radios grandes (≥ 44px). Al corregir, el color
 * nunca va solo: cada estado lleva ícono y texto ("Correcta", "Tu respuesta").
 */
export function Alternativas({ nombre, leyenda, alternativas, seleccionada, onSeleccionar, correccion, deshabilitado }: PropsAlternativas) {
  const bloqueado = deshabilitado || Boolean(correccion);
  return (
    <fieldset>
      <legend className="sr-only">{leyenda}</legend>
      <div className="flex flex-col gap-3">
        {[...alternativas]
          .sort((a, b) => a.posicion - b.posicion)
          .map((a, i) => {
            const elegida = seleccionada === a.id;
            const esCorrecta = correccion?.correctaId === a.id;
            const esError = Boolean(correccion) && elegida && !esCorrecta;
            return (
              <label
                key={a.id}
                className={cn(
                  'flex min-h-14 items-start gap-4 rounded-md border bg-surface-container-lowest px-4 py-3 text-body-lg text-on-surface',
                  'transition-[border-color,background-color,box-shadow] duration-150 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary has-[:focus-visible]:ring-offset-2',
                  !bloqueado && 'cursor-pointer hover:border-outline hover:bg-surface-container-low',
                  esCorrecta
                    ? 'border-success bg-success-container/60'
                    : esError
                      ? 'border-error bg-error-container/60'
                      : elegida
                        ? 'border-primary bg-primary-fixed/45 shadow-card'
                        : 'border-border',
                )}
              >
                <input
                  type="radio"
                  name={nombre}
                  value={a.id}
                  checked={elegida}
                  disabled={bloqueado && !elegida}
                  onChange={() => !bloqueado && onSeleccionar(a.id)}
                  className="sr-only"
                />
                <span
                  aria-hidden="true"
                  className={cn(
                    'mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full border text-label-md font-semibold',
                    esCorrecta
                      ? 'border-success bg-success text-on-success'
                      : esError
                        ? 'border-error bg-error text-on-error'
                        : elegida
                          ? 'border-primary bg-primary text-on-primary'
                          : 'border-border-strong text-on-surface-variant',
                  )}
                >
                  {esCorrecta ? <Icono nombre="check" className="text-lg" /> : esError ? <Icono nombre="close" className="text-lg" /> : LETRAS[i]}
                </span>
                <span className="min-w-0 flex-1 pt-0.5">
                  <span className="sr-only">Alternativa {LETRAS[i]}: </span>
                  <TextoMat texto={a.texto} modo="linea" />
                  {esCorrecta && <span className="mt-1 block text-caption font-semibold text-success">Respuesta correcta</span>}
                  {esError && <span className="mt-1 block text-caption font-semibold text-error">Tu respuesta</span>}
                </span>
              </label>
            );
          })}
      </div>
    </fieldset>
  );
}
