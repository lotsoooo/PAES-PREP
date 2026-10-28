import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { MATERIA_ETIQUETA, TIPOS_PUBLICACION, TIPOS_PUBLICACION_LABEL, type TipoPublicacion } from '@paes-pro/shared';
import { ApiError } from '@/lib/api';
import { useCrearPublicacion, useMaterias } from '@/lib/data/comunidad';
import { useTitulo } from '@/hooks/utiles';
import { Pagina } from '@/components/ui/Pagina';
import { Card } from '@/components/ui/Card';
import { Input, Select } from '@/components/ui/Input';
import { RadioGrupo } from '@/components/ui/Seleccion';
import { Button } from '@/components/ui/Button';
import { Icono } from '@/components/ui/Icono';
import { Breadcrumbs } from '@/components/ui/Navegacion';
import { Modal } from '@/components/ui/Modal';
import { EditorMarkdown } from '@/components/comunidad/EditorMarkdown';

const esquema = z.object({
  tipo: z.enum(TIPOS_PUBLICACION),
  materiaId: z.string(),
  titulo: z.string().trim().min(8, 'Escribe un título de al menos 8 caracteres: que se entienda la duda.').max(180, 'Máximo 180 caracteres'),
  cuerpo: z.string().trim().min(20, 'Cuéntanos un poco más (mínimo 20 caracteres).').max(8000, 'Máximo 8.000 caracteres'),
});

type Formulario = z.infer<typeof esquema>;

const CLAVE_BORRADOR = 'paespro:borrador-publicacion';
const VACIO: Formulario = { tipo: 'duda', materiaId: '', titulo: '', cuerpo: '' };

const DESCRIPCION_TIPO: Record<TipoPublicacion, string> = {
  duda: 'Pide ayuda con un ejercicio',
  tip: 'Comparte un consejo que te sirvió',
  material: 'Resúmenes, guías o recursos',
  debate: 'Abre una conversación',
};

const ICONO_TIPO: Record<TipoPublicacion, string> = {
  duda: 'help',
  tip: 'lightbulb',
  material: 'description',
  debate: 'forum',
};

function leerBorrador(): Formulario | null {
  try {
    const crudo = localStorage.getItem(CLAVE_BORRADOR);
    if (!crudo) return null;
    const datos = esquema.partial().safeParse(JSON.parse(crudo));
    return datos.success ? { ...VACIO, ...datos.data } : null;
  } catch {
    return null;
  }
}

function guardarBorrador(datos: Formulario | null) {
  try {
    if (!datos || (!datos.titulo.trim() && !datos.cuerpo.trim())) localStorage.removeItem(CLAVE_BORRADOR);
    else localStorage.setItem(CLAVE_BORRADOR, JSON.stringify(datos));
  } catch {
    /* almacenamiento no disponible: el borrador solo vive en la pestaña */
  }
}

export default function Crear() {
  useTitulo('Crear publicación');
  const navegar = useNavegarSeguro();
  const materias = useMaterias();
  const crear = useCrearPublicacion();
  const [params] = useSearchParams();
  const mencion = params.get('mencion')?.slice(0, 80);
  const [inicial] = useState(() => leerBorrador());
  const [saliendo, setSaliendo] = useState(false);
  const [guardadoEn, setGuardadoEn] = useState<Date | null>(null);

  const {
    register,
    control,
    handleSubmit,
    watch,
    reset,
    setError,
    formState: { errors, isDirty },
  } = useForm<Formulario>({ resolver: zodResolver(esquema), defaultValues: inicial ?? (mencion ? { ...VACIO, cuerpo: `@${mencion} ` } : VACIO) });

  // Aviso único cuando se recupera un borrador.
  const avisado = useRef(false);
  useEffect(() => {
    if (!inicial || avisado.current) return;
    avisado.current = true;
    toast('Recuperamos tu borrador', {
      description: 'Sigue donde lo dejaste.',
      action: {
        label: 'Descartar',
        onClick: () => {
          guardarBorrador(null);
          reset(VACIO);
        },
      },
    });
  }, [inicial, reset]);

  // Autoguardado con pausa de 800 ms tras la última tecla.
  const valores = watch();
  const serializado = JSON.stringify(valores);
  useEffect(() => {
    const t = setTimeout(() => {
      const datos = JSON.parse(serializado) as Formulario;
      guardarBorrador(datos);
      if (datos.titulo.trim() || datos.cuerpo.trim()) setGuardadoEn(new Date());
    }, 800);
    return () => clearTimeout(t);
  }, [serializado]);

  const publicar = handleSubmit((d) => {
    crear.mutate(
      { titulo: d.titulo.trim(), cuerpo: d.cuerpo.trim(), tipo: d.tipo, materiaId: d.materiaId || null },
      {
        onSuccess: (p) => {
          guardarBorrador(null);
          toast.success('¡Publicado! Te avisaremos cuando alguien responda.');
          navegar(`/app/comunidad/${p.id}`, true);
        },
        onError: (e) => {
          if (e instanceof ApiError && e.details && typeof e.details === 'object') {
            for (const [campo, msg] of Object.entries(e.details as Record<string, string>)) {
              if (campo in VACIO) setError(campo as keyof Formulario, { message: String(msg) });
            }
          }
          toast.error(e.message);
        },
      },
    );
  });

  const cancelar = () => {
    if (isDirty || inicial) setSaliendo(true);
    else navegar('/app/comunidad');
  };

  return (
    <Pagina ancho="lectura">
      <Breadcrumbs items={[{ etiqueta: 'Comunidad', to: '/app/comunidad' }, { etiqueta: 'Crear publicación' }]} className="mb-4" />
      <Card padding="lg" radio="lg" como="section" aria-labelledby="titulo-crear">
        <h1 id="titulo-crear" className="text-headline-lg-mobile text-on-surface md:text-headline-lg">
          Crear publicación
        </h1>
        <p className="mt-2 text-body-md text-on-surface-variant">
          Una buena pregunta tiene el enunciado completo y lo que ya intentaste. Así te responden más rápido.
        </p>

        <form onSubmit={publicar} noValidate className="mt-8 flex flex-col gap-6">
          <Controller
            control={control}
            name="tipo"
            render={({ field }) => (
              <RadioGrupo
                leyenda="¿Qué quieres publicar?"
                nombre="tipo"
                valor={field.value}
                onCambio={field.onChange}
                variante="tarjeta"
                columnas={2}
                opciones={TIPOS_PUBLICACION.map((t) => ({
                  valor: t,
                  etiqueta: TIPOS_PUBLICACION_LABEL[t],
                  descripcion: DESCRIPCION_TIPO[t],
                  icono: ICONO_TIPO[t],
                }))}
              />
            )}
          />

          <Select
            label="Categoría"
            {...register('materiaId')}
            opciones={[
              { valor: '', etiqueta: 'General (técnicas de estudio, admisión, otros)' },
              ...(materias.data ?? []).map((m) => ({ valor: m.id, etiqueta: MATERIA_ETIQUETA[m.codigo] ?? m.nombre })),
            ]}
            hint={materias.isError ? 'No pudimos cargar las materias; puedes publicar como General.' : undefined}
          />

          <Input
            label="Título"
            placeholder="Ej.: ¿Cómo despejo x en una ecuación con fracciones?"
            maxLength={180}
            error={errors.titulo?.message}
            {...register('titulo')}
          />

          <Controller
            control={control}
            name="cuerpo"
            render={({ field }) => (
              <EditorMarkdown
                ref={field.ref}
                id="cuerpo-publicacion"
                label="Contenido"
                valor={field.value}
                onCambio={field.onChange}
                error={errors.cuerpo?.message}
                placeholder="Escribe tu duda, explicación o aporte. Si es un ejercicio, copia el enunciado y cuéntanos dónde te quedaste."
              />
            )}
          />

          <div className="flex flex-col-reverse gap-3 border-t border-border pt-6 sm:flex-row sm:items-center">
            <p className="text-caption text-on-surface-variant sm:mr-auto" aria-live="polite">
              {guardadoEn ? (
                <span className="inline-flex items-center gap-1">
                  <Icono nombre="cloud_done" className="text-base" />
                  Borrador guardado en este dispositivo
                </span>
              ) : (
                'Tu borrador se guarda solo mientras escribes.'
              )}
            </p>
            <Button variante="secundario" onClick={cancelar}>
              Cancelar
            </Button>
            <Button type="submit" cargando={crear.isPending} textoCargando="Publicando…" iconoDerecho="send">
              Publicar
            </Button>
          </div>
        </form>
      </Card>

      <Modal
        abierto={saliendo}
        onAbiertoChange={setSaliendo}
        titulo="¿Salir sin publicar?"
        descripcion="Tu borrador queda guardado en este dispositivo y lo verás al volver. También puedes descartarlo."
        ancho="sm"
        pie={
          <>
            <Button variante="fantasma" onClick={() => setSaliendo(false)}>
              Seguir editando
            </Button>
            <Button
              variante="peligro"
              onClick={() => {
                guardarBorrador(null);
                reset(VACIO);
                setSaliendo(false);
                navegar('/app/comunidad', true);
              }}
            >
              Descartar
            </Button>
            <Button onClick={() => navegar('/app/comunidad')}>Salir y guardar</Button>
          </>
        }
      />
    </Pagina>
  );
}

/** Navega sin que el autoguardado reescriba el borrador recién descartado. */
function useNavegarSeguro() {
  const navigate = useNavigate();
  return (ruta: string, reemplazar = false) => navigate(ruta, { replace: reemplazar });
}
