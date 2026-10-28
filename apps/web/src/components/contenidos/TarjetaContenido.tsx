import { Link } from 'react-router';
import type { DTOContenido } from '@paes-pro/shared';
import { MATERIA_ETIQUETA } from '@paes-pro/shared';
import { cn } from '@/lib/cn';
import { Icono } from '@/components/ui/Icono';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { InsigniaPremium } from '@/components/premium/Premium';
import { formatearDuracion } from '@/components/plan/fechas';
import { estadoAvance, TIPO_CONTENIDO } from './tipos';

/**
 * Portada dibujada: tono de la materia, ícono del tipo y el eje temático en
 * grande. Sin fotos de stock (no hay imágenes propias de cada lección).
 */
function Portada({ contenido, destacada }: { contenido: DTOContenido; destacada?: boolean }) {
  const tipo = TIPO_CONTENIDO[contenido.tipo] ?? TIPO_CONTENIDO.mixto!;
  const area = contenido.materia.area;
  const fondo =
    area === 'matematicas'
      ? 'bg-primary-container text-white'
      : area === 'lenguaje'
        ? 'bg-inverse-surface text-inverse-on-surface'
        : area === 'ciencias'
          ? 'bg-on-primary-fixed-variant text-white'
          : 'bg-surface-container-highest text-on-surface';
  return (
    <div className={cn('relative flex flex-col justify-between overflow-hidden', fondo, destacada ? 'min-h-56 p-6 md:min-h-72 md:p-8' : 'min-h-32 p-5')}>
      <Icono
        nombre={tipo.icono}
        className={cn('absolute -right-4 -bottom-6 opacity-15', destacada ? 'text-[220px]' : 'text-[128px]')}
      />
      <span className="relative text-caption font-semibold uppercase tracking-[0.06em] opacity-90">
        {MATERIA_ETIQUETA[contenido.materia.codigo] ?? contenido.materia.nombre}
      </span>
      {destacada && (
        <div className="relative">
          <p className="inline-flex items-center gap-1.5 text-label-md opacity-90">
            <Icono nombre={tipo.icono} className="text-lg" />
            {tipo.etiqueta} · {formatearDuracion(contenido.duracionMin)}
          </p>
          <h3 className="mt-2 max-w-xl text-headline-lg-mobile text-balance md:text-headline-lg">{contenido.titulo}</h3>
        </div>
      )}
      {!destacada && contenido.eje && <span className="relative text-body-md font-medium opacity-95">{contenido.eje.nombre}</span>}
    </div>
  );
}

export function TarjetaContenido({ contenido, destacada, className }: { contenido: DTOContenido; destacada?: boolean; className?: string }) {
  const tipo = TIPO_CONTENIDO[contenido.tipo] ?? TIPO_CONTENIDO.mixto!;
  const estado = estadoAvance(contenido);
  return (
    <article
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-md border border-border bg-surface-container-lowest shadow-card',
        'transition-[box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:shadow-card-hover focus-within:shadow-card-hover motion-reduce:hover:translate-y-0',
        className,
      )}
    >
      <Portada contenido={contenido} destacada={destacada} />
      <div className={cn('flex flex-1 flex-col', destacada ? 'p-6 md:p-8' : 'p-5')}>
        {!destacada && (
          <p className="inline-flex items-center gap-1.5 text-label-md text-primary">
            <Icono nombre={tipo.icono} className="text-lg" />
            {tipo.etiqueta} · {formatearDuracion(contenido.duracionMin)}
          </p>
        )}
        {!destacada && <h3 className="mt-2 text-body-lg font-semibold text-on-surface">{contenido.titulo}</h3>}
        {contenido.descripcion && (
          <p className={cn('text-on-surface-variant text-pretty', destacada ? 'text-body-lg' : 'mt-1 line-clamp-2 text-body-md')}>{contenido.descripcion}</p>
        )}
        {contenido.premium && <InsigniaPremium className="mt-3 self-start" />}
        <div className="mt-auto pt-5">
          <ProgressBar
            valor={contenido.porcentajeProgreso}
            etiqueta={<span className={cn('font-medium', estado.clase)}>{estado.texto}</span>}
            mostrarValor
            etiquetaAria={`Avance en ${contenido.titulo}`}
          />
        </div>
      </div>
      <Link
        to={`/app/contenidos/${contenido.slug}`}
        aria-label={`${contenido.titulo}: ${tipo.etiqueta}, ${estado.texto.toLowerCase()}`}
        className="absolute inset-0 z-10 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      />
    </article>
  );
}
