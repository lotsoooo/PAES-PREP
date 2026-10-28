import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import type { DTOIntentoResumen, DTOLogro, DTOPerfilPropio, DTOPublicacionFeed } from '@paes-pro/shared';
import { PRUEBAS_CORTA, actualizarPerfilCompletoSchema, formatearFecha, formatearNumero } from '@paes-pro/shared';
import { ApiError, urlArchivo } from '@/lib/api';
import { cerrarSesion } from '@/app/sesion';
import { usePerfilPropio } from '@/lib/data/perfil';
import { useActualizarPerfil, useSubirAvatar } from '@/lib/data/cuenta';
import { etiquetaColegio, useColegios } from '@/lib/data/catalogos';
import { useDebounce, useTitulo } from '@/hooks/utiles';
import { cn } from '@/lib/cn';
import { Pagina } from '@/components/ui/Pagina';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { BotonEnlace, Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Icono } from '@/components/ui/Icono';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Combobox, type OpcionCombobox } from '@/components/ui/Combobox';
import { Tabs } from '@/components/ui/Tabs';
import { Cargando, EstadoError, EstadoVacio, Skeleton } from '@/components/ui/Skeleton';
import { InsigniaPremium } from '@/components/premium/Premium';
import { TarjetaPublicacion } from '@/components/comunidad/Publicacion';

export default function Perfil() {
  useTitulo('Mi perfil');
  const { data, isPending, isError, error, refetch, isRefetching } = usePerfilPropio();

  if (isPending) {
    return (
      <Pagina>
        <Cargando etiqueta="Cargando tu perfil…">
          <Skeleton className="h-56 rounded-lg" />
          <Skeleton className="mt-6 h-28 rounded-md" />
          <div className="mt-6 grid gap-6 lg:grid-cols-12">
            <Skeleton className="h-72 rounded-md lg:col-span-8" />
            <Skeleton className="h-72 rounded-md lg:col-span-4" />
          </div>
        </Cargando>
      </Pagina>
    );
  }
  if (isError) {
    return (
      <Pagina>
        <EstadoError titulo="No pudimos cargar tu perfil" descripcion={error.message} onReintentar={() => void refetch()} cargando={isRefetching} />
      </Pagina>
    );
  }

  return (
    <Pagina>
      <Cabecera datos={data} />
      <Resumen resumen={data.resumen} />
      <div className="mt-6 grid gap-6 lg:grid-cols-12">
        <Actividad datos={data} />
        <Logros logros={data.logros} />
      </div>
    </Pagina>
  );
}

/* --------------------------------------------------------------------------
 * Cabecera
 * -------------------------------------------------------------------------- */

function Cabecera({ datos }: { datos: DTOPerfilPropio }) {
  const { usuario } = datos;
  const nombre = [usuario.nombre, usuario.apellido].filter(Boolean).join(' ');
  const [editando, setEditando] = useState(false);
  const [saliendo, setSaliendo] = useState(false);
  const navegar = useNavigate();
  const archivo = useRef<HTMLInputElement>(null);
  const subir = useSubirAvatar();

  const alElegir = (f: File | undefined) => {
    if (!f) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(f.type)) {
      toast.error('Usa una imagen PNG, JPG o WEBP.');
      return;
    }
    if (f.size > 2 * 1024 * 1024) {
      toast.error('La foto pesa más de 2 MB. Elige una más liviana.');
      return;
    }
    subir.mutate(f, {
      onSuccess: () => toast.success('Foto actualizada'),
      onError: (e) => toast.error(e.message),
    });
  };

  const salir = async () => {
    setSaliendo(true);
    try {
      await cerrarSesion();
      navegar('/login', { replace: true });
    } finally {
      setSaliendo(false);
    }
  };

  const lineaColegio = [usuario.curso, usuario.colegio?.nombre].filter(Boolean).join(' · ');
  const meta = [usuario.carrera?.nombre, usuario.universidad?.nombre].filter(Boolean).join(', ');

  return (
    <section aria-labelledby="titulo-perfil" className="overflow-hidden rounded-lg border border-border bg-surface-container-lowest shadow-card">
      <div aria-hidden="true" className="h-24 bg-primary-fixed md:h-28" />
      <div className="flex flex-col gap-5 px-5 pb-6 md:flex-row md:items-end md:px-8">
        <div className="relative -mt-14 self-start md:-mt-16">
          <span className="inline-flex rounded-full bg-surface-container-lowest p-1.5">
            <Avatar nombre={nombre} url={urlArchivo(usuario.avatarUrl)} tamano="xl" className="[&>span:first-child]:size-28 [&>img]:size-28" />
          </span>
          <button
            type="button"
            onClick={() => archivo.current?.click()}
            disabled={subir.isPending}
            aria-label="Cambiar foto de perfil"
            title="Cambiar foto de perfil"
            className="absolute bottom-1 right-1 flex size-11 items-center justify-center rounded-full bg-primary text-on-primary ring-4 ring-surface-container-lowest transition-transform hover:scale-105 disabled:opacity-70"
          >
            <Icono nombre={subir.isPending ? 'progress_activity' : 'photo_camera'} className={cn('text-xl', subir.isPending && 'animate-spin')} />
          </button>
          <input
            ref={archivo}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="sr-only"
            tabIndex={-1}
            aria-hidden="true"
            onChange={(e) => {
              alElegir(e.target.files?.[0]);
              e.target.value = '';
            }}
          />
        </div>

        <div className="min-w-0 flex-1 md:pb-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h1 id="titulo-perfil" className="text-headline-lg-mobile text-on-surface md:text-headline-lg">
              {nombre}
            </h1>
            {usuario.esPremium && <InsigniaPremium />}
          </div>
          <p className="mt-1 text-body-md text-on-surface-variant">
            {lineaColegio || (
              <button type="button" onClick={() => setEditando(true)} className="rounded-sm text-primary hover:underline">
                Agrega tu curso y colegio
              </button>
            )}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Chip tono="primario" icono="school">
              {usuario.puntajeMeta ? `Puntaje meta: ${usuario.puntajeMeta}` : 'Sin puntaje meta'}
            </Chip>
            <Chip tono="naranjo" icono="local_fire_department" iconoRelleno>
              Racha: {usuario.rachaActual} {usuario.rachaActual === 1 ? 'día' : 'días'}
            </Chip>
            {meta && <Chip icono="flag">{meta}</Chip>}
          </div>
        </div>

        <div className="flex gap-3 md:flex-col md:pb-1">
          <Button iconoIzquierdo="edit" onClick={() => setEditando(true)} className="flex-1">
            Editar perfil
          </Button>
          <Button
            variante="secundario"
            iconoIzquierdo="logout"
            onClick={() => void salir()}
            cargando={saliendo}
            className="flex-1 border-error text-error hover:bg-error/8 active:bg-error/12"
          >
            Cerrar sesión
          </Button>
        </div>
      </div>
      <ModalEditar abierto={editando} onCerrar={() => setEditando(false)} datos={datos} />
    </section>
  );
}

/* --------------------------------------------------------------------------
 * Resumen de rendimiento
 * -------------------------------------------------------------------------- */

function Resumen({ resumen }: { resumen: DTOPerfilPropio['resumen'] }) {
  const horas = resumen.minutosEstudio / 60;
  const cifras = [
    { etiqueta: 'Ensayos rendidos', valor: formatearNumero(resumen.ensayos) },
    { etiqueta: 'Mejor puntaje', valor: resumen.mejorPuntaje ?? '—' },
    { etiqueta: 'Promedio', valor: resumen.promedioPuntaje ?? '—' },
    { etiqueta: 'Preguntas respondidas', valor: formatearNumero(resumen.preguntasRespondidas) },
    { etiqueta: 'Precisión', valor: resumen.precision === null ? '—' : `${formatearNumero(resumen.precision)} %` },
    { etiqueta: 'Horas de estudio', valor: horas < 1 ? `${resumen.minutosEstudio} min` : formatearNumero(Math.round(horas * 10) / 10) },
  ];
  return (
    <section aria-labelledby="titulo-resumen" className="mt-6">
      <h2 id="titulo-resumen" className="sr-only">
        Resumen de rendimiento
      </h2>
      <Card padding="ninguno">
        <dl className="grid grid-cols-2 divide-border sm:grid-cols-3 lg:grid-cols-6 lg:divide-x">
          {cifras.map((c) => (
            <div key={c.etiqueta} className="px-5 py-4">
              <dt className="text-caption text-on-surface-variant">{c.etiqueta}</dt>
              <dd className="mt-1 text-headline-md font-bold text-on-surface tabular-nums">{c.valor}</dd>
            </div>
          ))}
        </dl>
      </Card>
      {resumen.ensayos === 0 && (
        <p className="mt-3 text-body-md text-on-surface-variant">
          Rinde tu primer ensayo para ver tu rendimiento aquí.{' '}
          <Link to="/app/ensayos" className="font-medium text-primary hover:underline">
            Ver ensayos
          </Link>
        </p>
      )}
    </section>
  );
}

/* --------------------------------------------------------------------------
 * Actividad: últimos ensayos, publicaciones y guardados
 * -------------------------------------------------------------------------- */

type Pestana = 'ensayos' | 'publicaciones' | 'guardados';

function Actividad({ datos }: { datos: DTOPerfilPropio }) {
  const [pestana, setPestana] = useState<Pestana>('ensayos');
  return (
    <section aria-label="Tu actividad" className="min-w-0 lg:col-span-8">
      <Tabs
        etiquetaAria="Tu actividad"
        valor={pestana}
        onValorChange={(v) => setPestana(v as Pestana)}
        items={[
          { valor: 'ensayos', etiqueta: 'Últimos ensayos', icono: 'assignment' },
          { valor: 'publicaciones', etiqueta: 'Mis publicaciones', icono: 'forum', contador: datos.publicaciones.length },
          { valor: 'guardados', etiqueta: 'Guardados', icono: 'bookmark', contador: datos.guardados.length },
        ]}
      />
      <div className="mt-4" role="tabpanel">
        {pestana === 'ensayos' && <ListaEnsayos intentos={datos.ultimosIntentos} />}
        {pestana === 'publicaciones' && (
          <ListaPublicaciones
            items={datos.publicaciones}
            vacio={{
              titulo: 'Aún no publicas en la comunidad',
              descripcion: 'Pregunta lo que no te salga o comparte un tip que te sirvió.',
              accion: (
                <BotonEnlace to="/app/comunidad/nuevo" iconoIzquierdo="edit">
                  Crear publicación
                </BotonEnlace>
              ),
            }}
          />
        )}
        {pestana === 'guardados' && (
          <ListaPublicaciones
            items={datos.guardados}
            vacio={{
              titulo: 'No tienes publicaciones guardadas',
              descripcion: 'Toca «Guardar» en cualquier publicación para tenerla a mano aquí.',
              accion: (
                <BotonEnlace to="/app/comunidad" variante="secundario">
                  Explorar la comunidad
                </BotonEnlace>
              ),
            }}
          />
        )}
      </div>
    </section>
  );
}

function ListaEnsayos({ intentos }: { intentos: DTOIntentoResumen[] }) {
  if (intentos.length === 0) {
    return (
      <EstadoVacio
        icono="assignment"
        titulo="Todavía no rindes ensayos"
        descripcion="Parte con el ensayo de diagnóstico: es gratis y ajusta tu plan de estudio."
        accion={<BotonEnlace to="/app/ensayos">Ver ensayos</BotonEnlace>}
      />
    );
  }
  return (
    <Card padding="ninguno">
      <ul className="divide-y divide-border">
        {intentos.map((i) => {
          const total = i.correctas + i.incorrectas + i.omitidas;
          return (
            <li key={i.id}>
              <Link
                to={`/app/ensayos/intentos/${i.id}`}
                className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-surface-container-low"
              >
                <span className="flex size-11 shrink-0 items-center justify-center rounded bg-primary-fixed text-label-md font-bold text-primary">
                  {PRUEBAS_CORTA[i.prueba] ?? i.prueba}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-body-md font-medium text-on-surface">{i.titulo}</span>
                  <span className="block text-caption text-on-surface-variant">
                    {formatearFecha(i.entregadoEn ?? i.iniciadoEn)} · {i.correctas}/{total} correctas
                  </span>
                </span>
                <span className="text-right">
                  <span className="block text-body-lg font-bold text-on-surface tabular-nums">{i.puntaje ?? '—'}</span>
                  <span className="block text-caption text-on-surface-variant">puntos</span>
                </span>
                <Icono nombre="chevron_right" className="text-on-surface-variant" />
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="border-t border-border px-5 py-3">
        <Link to="/app/estadisticas" className="text-label-md font-medium text-primary hover:underline">
          Ver estadísticas completas
        </Link>
      </div>
    </Card>
  );
}

function ListaPublicaciones({
  items,
  vacio,
}: {
  items: DTOPublicacionFeed[];
  vacio: { titulo: string; descripcion: string; accion: React.ReactNode };
}) {
  if (items.length === 0) return <EstadoVacio icono="forum" titulo={vacio.titulo} descripcion={vacio.descripcion} accion={vacio.accion} />;
  return (
    <ul className="flex flex-col gap-4">
      {items.map((p) => (
        <li key={p.id}>
          <TarjetaPublicacion publicacion={p} />
        </li>
      ))}
    </ul>
  );
}

/* --------------------------------------------------------------------------
 * Logros
 * -------------------------------------------------------------------------- */

function Logros({ logros }: { logros: DTOLogro[] }) {
  const obtenidos = logros.filter((l) => l.obtenidoEn).length;
  return (
    <Card como="section" aria-labelledby="titulo-logros" className="lg:col-span-4">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="titulo-logros" className="text-body-lg font-semibold text-on-surface">
          Logros
        </h2>
        <span className="text-caption text-on-surface-variant tabular-nums">
          {obtenidos} de {logros.length}
        </span>
      </div>
      {logros.length === 0 ? (
        <p className="mt-3 text-body-md text-on-surface-variant">Los logros aparecerán a medida que estudies.</p>
      ) : (
        <ul className="mt-4 flex flex-col gap-3">
          {logros.map((l) => {
            const ok = Boolean(l.obtenidoEn);
            return (
              <li key={l.codigo} className={cn('flex items-start gap-3 rounded p-2', !ok && 'opacity-70')}>
                <span
                  className={cn(
                    'flex size-10 shrink-0 items-center justify-center rounded-full',
                    ok ? 'bg-primary-fixed text-primary' : 'bg-surface-container text-outline',
                  )}
                >
                  <Icono nombre={ok ? l.icono : 'lock'} relleno={ok} className="text-xl" />
                </span>
                <span className="min-w-0">
                  <span className={cn('block text-label-md font-semibold', ok ? 'text-on-surface' : 'text-on-surface-variant')}>{l.nombre}</span>
                  <span className="block text-caption text-on-surface-variant">{l.descripcion}</span>
                  {ok && l.obtenidoEn && (
                    <span className="mt-0.5 block text-caption text-success">Obtenido el {formatearFecha(l.obtenidoEn)}</span>
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

/* --------------------------------------------------------------------------
 * Editar perfil
 * -------------------------------------------------------------------------- */

const esquemaEditar = actualizarPerfilCompletoSchema.required({ nombre: true });

interface FormEditar {
  nombre: string;
  apellido: string | null;
  curso: string | null;
  colegioId: string | null;
  puntajeMeta: number | null;
}

const CURSOS = ['1° Medio', '2° Medio', '3° Medio', '4° Medio', 'Egresado/a'];

function ModalEditar({ abierto, onCerrar, datos }: { abierto: boolean; onCerrar: () => void; datos: DTOPerfilPropio }) {
  const u = datos.usuario;
  const actualizar = useActualizarPerfil();
  const [colegio, setColegio] = useState<OpcionCombobox | null>(u.colegio ? etiquetaColegio(u.colegio) : null);
  const [busqueda, setBusqueda] = useState(u.colegio?.nombre ?? '');
  const colegios = useColegios(useDebounce(busqueda, 250));

  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isDirty },
  } = useForm<FormEditar>({
    resolver: zodResolver(esquemaEditar) as never,
    values: {
      nombre: u.nombre,
      apellido: u.apellido,
      curso: u.curso,
      colegioId: u.colegio?.id ?? null,
      puntajeMeta: u.puntajeMeta,
    },
  });

  const guardar = handleSubmit((d) => {
    actualizar.mutate(
      {
        nombre: d.nombre.trim(),
        apellido: d.apellido?.trim() || null,
        curso: d.curso?.trim() || null,
        colegioId: d.colegioId,
        puntajeMeta: d.puntajeMeta,
      },
      {
        onSuccess: () => {
          toast.success('Perfil actualizado');
          onCerrar();
        },
        onError: (e) => {
          if (e instanceof ApiError && e.details && typeof e.details === 'object') {
            for (const [campo, msg] of Object.entries(e.details as Record<string, string>)) {
              setError(campo as keyof FormEditar, { message: String(msg) });
            }
          }
          toast.error(e.message);
        },
      },
    );
  });

  const cerrar = () => {
    reset();
    onCerrar();
  };

  return (
    <Modal
      abierto={abierto}
      onAbiertoChange={(v) => !v && cerrar()}
      titulo="Editar perfil"
      descripcion="Tu nombre y foto se ven en la comunidad. El correo se cambia en Configuración."
      ancho="lg"
      pie={
        <>
          <Button variante="fantasma" onClick={cerrar}>
            Cancelar
          </Button>
          <Button onClick={() => void guardar()} cargando={actualizar.isPending} disabled={!isDirty}>
            Guardar cambios
          </Button>
        </>
      }
    >
      <form onSubmit={guardar} noValidate className="grid gap-5 sm:grid-cols-2">
        <Input label="Nombre" autoComplete="given-name" error={errors.nombre?.message} {...register('nombre')} />
        <Input
          label="Apellido"
          opcional
          autoComplete="family-name"
          error={errors.apellido?.message}
          {...register('apellido', { setValueAs: (v: string) => v || null })}
        />
        <Input
          label="Curso"
          opcional
          list="cursos-sugeridos"
          placeholder="4° Medio"
          error={errors.curso?.message}
          {...register('curso', { setValueAs: (v: string) => v || null })}
        />
        <datalist id="cursos-sugeridos">
          {CURSOS.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
        <Input
          label="Puntaje meta"
          opcional
          type="number"
          inputMode="numeric"
          min={100}
          max={1000}
          step={1}
          hint="Entre 100 y 1.000 puntos."
          error={errors.puntajeMeta ? 'Ingresa un puntaje entre 100 y 1.000.' : undefined}
          {...register('puntajeMeta', { setValueAs: (v: string) => (v === '' || v === null ? null : Number(v)) })}
        />
        <Controller
          control={control}
          name="colegioId"
          render={({ field }) => (
            <Combobox
              className="sm:col-span-2"
              label="Colegio"
              icono="school"
              placeholder="Busca tu colegio"
              valor={colegio}
              onSeleccionar={(o) => {
                setColegio(o);
                field.onChange(o?.id ?? null);
              }}
              opciones={(colegios.data ?? []).map(etiquetaColegio)}
              busqueda={busqueda}
              onBusquedaChange={setBusqueda}
              cargando={colegios.isFetching}
              vacio="No encontramos ese colegio. Prueba con otra palabra."
              error={errors.colegioId?.message}
            />
          )}
        />
        <button type="submit" className="sr-only" tabIndex={-1}>
          Guardar
        </button>
      </form>
    </Modal>
  );
}
