import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useMutation } from '@tanstack/react-query';
import type { DTOMensajeIA, DTORespuestaIA } from '@paes-pro/shared';
import { ApiError, post } from '@/lib/api';
import { usePlan } from '@/components/premium/plan';
import { TextoMat } from '@/components/contenido/TextoMat';
import { Drawer } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Icono } from '@/components/ui/Icono';
import { cn } from '@/lib/cn';

export interface ContextoPaesBot {
  tipo: 'leccion' | 'explicacion' | 'estadisticas' | 'general';
  /** slug de la lección, `intentoId:numero` de la explicación, etc. */
  id?: string;
}

const SUGERENCIAS: Record<ContextoPaesBot['tipo'], string[]> = {
  leccion: ['Explícame la idea principal con un ejemplo', 'Dame un ejercicio para practicar', '¿Qué error es el más común aquí?'],
  explicacion: ['¿Por qué mi alternativa está mal?', 'Explícalo de otra forma', 'Dame un ejercicio parecido'],
  estadisticas: ['¿Qué debería estudiar esta semana?', '¿Cuál es mi eje más débil?', '¿Cómo mejoro mi tiempo por pregunta?'],
  general: ['¿Cómo organizo mi semana de estudio?', 'Dame un consejo para el día de la PAES'],
};

/**
 * Tutor IA "PAES-Bot" (Premium). Acento naranjo: el color de la IA.
 * Botón + panel lateral con la conversación; el contexto de la pantalla viaja
 * al API para que la respuesta hable de lo que el estudiante está viendo.
 */
export function PaesBot({ contexto, className, variante = 'boton' }: { contexto: ContextoPaesBot; className?: string; variante?: 'boton' | 'flotante' }) {
  const [abierto, setAbierto] = useState(false);
  const { conPremium } = usePlan();
  const abrir = () => conPremium('PAES-Bot te explica cada tema y cada error, paso a paso, cuando lo necesites.', () => setAbierto(true));

  return (
    <>
      {variante === 'flotante' ? (
        <button
          type="button"
          onClick={abrir}
          className={cn(
            'fixed bottom-24 right-4 z-30 inline-flex min-h-12 items-center gap-2 rounded-full bg-secondary-container px-5 text-label-md font-semibold text-on-secondary-container shadow-float',
            'transition-transform duration-150 hover:-translate-y-0.5 lg:bottom-8 lg:right-8',
            className,
          )}
        >
          <Icono nombre="smart_toy" relleno />
          Pregúntale a PAES-Bot
        </button>
      ) : (
        <button
          type="button"
          onClick={abrir}
          className={cn(
            'inline-flex min-h-11 items-center gap-2 rounded border border-secondary-container/50 bg-secondary-fixed px-4 text-label-md font-semibold text-on-secondary-fixed-variant',
            'transition-colors duration-150 hover:bg-secondary-fixed-dim/60',
            className,
          )}
        >
          <Icono nombre="smart_toy" relleno />
          Pregúntale a PAES-Bot
        </button>
      )}
      <Drawer
        abierto={abierto}
        onAbiertoChange={setAbierto}
        titulo={
          <span className="inline-flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-full bg-secondary-fixed text-secondary-container">
              <Icono nombre="smart_toy" relleno className="text-xl" />
            </span>
            PAES-Bot
          </span>
        }
        descripcion="Tu tutor IA. Revisa siempre los pasos: puede equivocarse."
      >
        <Conversacion contexto={contexto} />
      </Drawer>
    </>
  );
}

function Conversacion({ contexto }: { contexto: ContextoPaesBot }) {
  const [proveedor, setProveedor] = useState<DTORespuestaIA['proveedor'] | null>(null);
  const [mensajes, setMensajes] = useState<DTOMensajeIA[]>([]);
  const [texto, setTexto] = useState('');
  const finRef = useRef<HTMLDivElement>(null);

  const enviar = useMutation({
    mutationFn: (historial: DTOMensajeIA[]) => post<DTORespuestaIA>('/ia/chat', { mensajes: historial.slice(-20), contexto }),
    onSuccess: (r) => {
      setProveedor(r.proveedor);
      setMensajes((m) => [...m, { rol: 'asistente', texto: r.respuesta }]);
    },
  });

  useEffect(() => {
    finRef.current?.scrollIntoView({ block: 'end' });
  }, [mensajes, enviar.isPending]);

  const mandar = (contenido: string) => {
    const limpio = contenido.trim();
    if (!limpio || enviar.isPending) return;
    const historial: DTOMensajeIA[] = [...mensajes, { rol: 'usuario', texto: limpio }];
    setMensajes(historial);
    setTexto('');
    enviar.mutate(historial);
  };

  const alEnviar = (e: FormEvent) => {
    e.preventDefault();
    mandar(texto);
  };

  return (
    <div className="flex h-full min-h-[60vh] flex-col">
      {proveedor === 'simulado' && <p role="status" className="mb-4 rounded bg-secondary-fixed p-3 text-caption text-on-secondary-fixed-variant">Modo demostración: estas respuestas se preparan con el material disponible, sin un modelo de IA conectado.</p>}
      <div className="flex-1 space-y-4 overflow-y-auto pb-4" aria-live="polite">
        {mensajes.length === 0 && (
          <div className="rounded-md bg-surface-container-low p-4">
            <p className="text-body-md text-on-surface">¿En qué te ayudo? Puedes partir con una de estas:</p>
            <div className="mt-3 flex flex-col gap-2">
              {SUGERENCIAS[contexto.tipo].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => mandar(s)}
                  className="min-h-11 rounded border border-border bg-surface-container-lowest px-3 py-2 text-left text-label-md text-on-surface transition-colors hover:border-secondary-container"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {mensajes.map((m, i) => (
          <div key={i} className={cn('flex', m.rol === 'usuario' ? 'justify-end' : 'justify-start')}>
            <div
              className={cn(
                'max-w-[85%] rounded-md px-4 py-3 text-body-md',
                m.rol === 'usuario' ? 'bg-primary text-on-primary' : 'border border-border bg-surface-container-lowest text-on-surface',
              )}
            >
              {m.rol === 'asistente' ? <TextoMat texto={m.texto} /> : m.texto}
            </div>
          </div>
        ))}
        {enviar.isPending && (
          <p className="inline-flex items-center gap-2 text-caption text-on-surface-variant">
            <Icono nombre="progress_activity" className="animate-spin text-base" />
            PAES-Bot está pensando…
          </p>
        )}
        {enviar.isError && (
          <p role="alert" className="rounded bg-error-container px-3 py-2 text-caption text-on-error-container">
            {enviar.error instanceof ApiError ? enviar.error.message : 'No pudimos responder. Intenta de nuevo.'}
          </p>
        )}
        <div ref={finRef} />
      </div>
      <form onSubmit={alEnviar} className="flex items-end gap-2 border-t border-border pt-4">
        <label htmlFor="mensaje-paesbot" className="sr-only">
          Escribe tu pregunta
        </label>
        <textarea
          id="mensaje-paesbot"
          rows={2}
          value={texto}
          maxLength={4000}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              mandar(texto);
            }
          }}
          placeholder="Escribe tu pregunta…"
          className="min-h-11 flex-1 resize-none rounded border border-border-strong bg-surface-container-lowest px-3 py-2 text-body-md text-on-surface placeholder:text-outline focus:border-primary focus:shadow-focus focus:outline-none"
        />
        <Button type="submit" cargando={enviar.isPending} disabled={!texto.trim()} iconoIzquierdo="send" aria-label="Enviar">
          <span className="sr-only md:not-sr-only">Enviar</span>
        </Button>
      </form>
    </div>
  );
}
