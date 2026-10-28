import { useState } from 'react';
import { toast } from 'sonner';
import type { DTOResultadoMiniTest } from '@paes-pro/shared';
import { ApiError } from '@/lib/api';
import { useMiniTest, useResponderMiniTest } from '@/lib/data/contenidos';
import { Modal } from '@/components/ui/Modal';
import { BotonEnlace, Button } from '@/components/ui/Button';
import { Icono } from '@/components/ui/Icono';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Cargando, EstadoError, Skeleton } from '@/components/ui/Skeleton';
import { TextoMat } from '@/components/contenido/TextoMat';
import { Alternativas } from '@/components/repaso/Alternativas';

/** Mini-test de 3 preguntas en un modal: una pregunta a la vez y corrección al final. */
export function MiniTest({ contenidoId, abierto, onAbiertoChange }: { contenidoId: string; abierto: boolean; onAbiertoChange: (v: boolean) => void }) {
  const preguntas = useMiniTest(contenidoId, abierto);
  const responder = useResponderMiniTest(contenidoId);
  const [indice, setIndice] = useState(0);
  const [respuestas, setRespuestas] = useState<Record<string, string>>({});
  const [resultado, setResultado] = useState<DTOResultadoMiniTest | null>(null);

  const reiniciar = () => {
    setIndice(0);
    setRespuestas({});
    setResultado(null);
  };
  const cambiarAbierto = (v: boolean) => {
    onAbiertoChange(v);
    if (!v) setTimeout(reiniciar, 200);
  };

  const lista = preguntas.data ?? [];
  const actual = lista[indice];
  const ultima = indice === lista.length - 1;

  const entregar = () => {
    responder.mutate(
      lista.map((p) => ({ preguntaId: p.id, alternativaId: respuestas[p.id] ?? null })),
      {
        onSuccess: (r) => {
          setResultado(r);
          setIndice(0);
          if (r.correctas < r.total) toast.info('Las preguntas que fallaste quedaron en tu cuaderno de errores.');
        },
        onError: (e) => toast.error(e instanceof ApiError ? e.message : 'No pudimos corregir tu mini-test.'),
      },
    );
  };

  const detalle = resultado && actual ? resultado.detalle.find((d) => d.preguntaId === actual.id) : null;

  return (
    <Modal
      abierto={abierto}
      onAbiertoChange={cambiarAbierto}
      ancho="lg"
      titulo={resultado ? `Obtuviste ${resultado.correctas} de ${resultado.total}` : '¿Entendiste la lección?'}
      descripcion={
        resultado
          ? resultado.correctas === resultado.total
            ? '¡Impecable! Dominas lo esencial de esta lección.'
            : 'Revisa la explicación de cada pregunta antes de seguir.'
          : 'Tres preguntas rápidas para comprobarlo. No afectan tu puntaje.'
      }
    >
      {preguntas.isLoading ? (
        <Cargando etiqueta="Cargando preguntas…">
          <Skeleton className="h-6 w-3/4" />
          <div className="mt-5 flex flex-col gap-3">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-14 rounded-md" />
            ))}
          </div>
        </Cargando>
      ) : preguntas.isError ? (
        <EstadoError
          compacto
          titulo="No hay mini-test disponible"
          descripcion={preguntas.error instanceof ApiError ? preguntas.error.message : 'Intenta de nuevo en unos segundos.'}
          onReintentar={() => void preguntas.refetch()}
        />
      ) : actual ? (
        <div>
          <ProgressBar
            valor={((indice + 1) / lista.length) * 100}
            etiqueta={`Pregunta ${indice + 1} de ${lista.length}`}
            grosor="fino"
            etiquetaAria="Avance del mini-test"
          />
          <TextoMat texto={actual.enunciado} className="mt-5 text-body-lg text-on-surface" />
          <div className="mt-5">
            <Alternativas
              nombre={`mini-${actual.id}`}
              leyenda={`Alternativas de la pregunta ${indice + 1}`}
              alternativas={actual.alternativas}
              seleccionada={resultado ? (detalle?.tuRespuestaId ?? null) : (respuestas[actual.id] ?? null)}
              onSeleccionar={(id) => setRespuestas((r) => ({ ...r, [actual.id]: id }))}
              correccion={detalle ? { correctaId: detalle.alternativaCorrectaId } : null}
            />
          </div>
          {detalle && (
            <div className="mt-5 rounded-md bg-surface-container-low p-4">
              <p className="flex items-center gap-2 text-label-md font-semibold text-on-surface">
                <Icono nombre={detalle.esCorrecta ? 'check_circle' : 'info'} relleno className={detalle.esCorrecta ? 'text-success' : 'text-primary'} />
                {detalle.esCorrecta ? 'Bien hecho' : detalle.tuRespuestaId ? 'Así se resuelve' : 'La dejaste en blanco'}
              </p>
              <TextoMat texto={detalle.explicacion} className="mt-2 text-body-md text-on-surface-variant" />
            </div>
          )}
          <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button variante="fantasma" iconoIzquierdo="arrow_back" disabled={indice === 0} onClick={() => setIndice((i) => i - 1)}>
              Anterior
            </Button>
            {resultado ? (
              ultima ? (
                <div className="flex flex-col-reverse gap-3 sm:flex-row">
                  {resultado.correctas < resultado.total && (
                    <BotonEnlace to="/app/repaso" variante="secundario">
                      Ver mi cuaderno
                    </BotonEnlace>
                  )}
                  <Button onClick={() => cambiarAbierto(false)}>Terminar</Button>
                </div>
              ) : (
                <Button iconoDerecho="arrow_forward" onClick={() => setIndice((i) => i + 1)}>
                  Siguiente
                </Button>
              )
            ) : ultima ? (
              <Button onClick={entregar} cargando={responder.isPending} textoCargando="Corrigiendo…" iconoDerecho="done_all">
                Corregir
              </Button>
            ) : (
              <Button iconoDerecho="arrow_forward" onClick={() => setIndice((i) => i + 1)}>
                Siguiente
              </Button>
            )}
          </div>
        </div>
      ) : null}
    </Modal>
  );
}
