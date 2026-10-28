import { Link } from 'react-router';
import type { DTOEnsayo, DTOIntentoResumen } from '@paes-pro/shared';
import { formatearFecha, PRUEBAS_LABEL } from '@paes-pro/shared';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { Dificultad, Metadato } from '@/components/ui/Datos';
import { Icono } from '@/components/ui/Icono';
import { cn } from '@/lib/cn';
import { formatoDuracion } from './formato';

/** Card de la biblioteca: materia, título, descripción y metadatos (Stitch). */
export function TarjetaEnsayo({ ensayo }: { ensayo: DTOEnsayo }) {
  const bloqueado = ensayo.bloqueadoPorPlan;
  return (
    <Card como="li" padding="ninguno" interactiva className="group relative flex flex-col">
      <Link
        to={`/app/ensayos/${ensayo.slug}`}
        className="flex flex-1 flex-col rounded-md p-6 after:absolute after:inset-0 after:rounded-md focus-visible:outline-none"
      >
        <div className="flex items-start justify-between gap-3">
          <Chip tono="primario">{PRUEBAS_LABEL[ensayo.prueba]}</Chip>
          {bloqueado ? (
            <span className="flex size-9 items-center justify-center rounded-full bg-tertiary-fixed text-tertiary" title="Ensayo Premium">
              <Icono nombre="lock" relleno className="text-xl" etiqueta="Ensayo Premium" />
            </span>
          ) : ensayo.intentoEnCursoId ? (
            <Chip tono="naranjo" tamano="sm" icono="play_circle">
              En curso
            </Chip>
          ) : (
            <Icono nombre="arrow_forward" className="text-on-surface-variant transition-transform duration-150 group-hover:translate-x-0.5" />
          )}
        </div>
        <h3 className={cn('mt-4 text-headline-md text-balance', bloqueado ? 'text-on-surface-variant' : 'text-on-surface')}>
          {ensayo.titulo}
        </h3>
        {ensayo.descripcion && <p className="mt-2 line-clamp-2 text-body-md text-on-surface-variant">{ensayo.descripcion}</p>}
        <div className="flex-1" />
        <div className="mt-6 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-outline-variant pt-4">
          <Metadato icono="format_list_numbered">{ensayo.preguntasCount} preguntas</Metadato>
          <Metadato icono="timer">{formatoDuracion(ensayo.duracionMin)}</Metadato>
          <Dificultad nivel={ensayo.nivel} />
        </div>
      </Link>
    </Card>
  );
}

/** Fila del historial "Mis intentos". */
export function FilaIntento({ intento }: { intento: DTOIntentoResumen }) {
  const enCurso = intento.estado === 'en_curso';
  const destino = enCurso ? `/app/ensayos/${intento.slug}/rendir` : `/app/ensayos/intentos/${intento.id}`;
  const total = intento.correctas + intento.incorrectas + intento.omitidas;
  return (
    <li>
      <Link
        to={destino}
        className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-md border border-border bg-surface-container-lowest px-5 py-4 shadow-card transition-[box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:shadow-card-hover"
      >
        <div className="min-w-0 flex-1 basis-60">
          <p className="truncate text-body-md font-semibold text-on-surface">{intento.titulo}</p>
          <p className="mt-0.5 text-caption text-on-surface-variant">
            {PRUEBAS_LABEL[intento.prueba]} · {formatearFecha(intento.entregadoEn ?? intento.iniciadoEn)}
          </p>
        </div>
        {enCurso ? (
          <Chip tono="naranjo" icono="play_circle">
            Continuar ensayo
          </Chip>
        ) : (
          <>
            <div className="text-right">
              <p className="text-caption text-on-surface-variant">Correctas</p>
              <p className="text-body-md font-semibold text-on-surface tabular-nums">
                {intento.correctas}/{total}
              </p>
            </div>
            <div className="min-w-20 text-right">
              <p className="text-caption text-on-surface-variant">Puntaje</p>
              <p className="text-headline-md font-bold text-primary tabular-nums">{intento.puntaje ?? '—'}</p>
            </div>
            <Icono nombre="chevron_right" className="text-on-surface-variant" />
          </>
        )}
      </Link>
    </li>
  );
}
