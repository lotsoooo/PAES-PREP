import { useRef, useState } from 'react';
import { Link } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useSesion } from '@/app/sesion';
import { urlArchivo } from '@/lib/api';
import { aplicarErroresApi } from '@/lib/data/auth';
import { etiquetaColegio, useColegios } from '@/lib/data/catalogos';
import { useActualizarPerfil, useSubirAvatar } from '@/lib/data/cuenta';
import { useDebounce } from '@/hooks/utiles';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Combobox, type OpcionCombobox } from '@/components/ui/Combobox';
import { Input, Select } from '@/components/ui/Input';
import { Icono } from '@/components/ui/Icono';
import { PanelSeccion } from './Comun';

const CURSOS = ['1° medio', '2° medio', '3° medio', '4° medio', 'Egresado/a', 'Otro'];
const MAX_AVATAR_MB = 5;

const esquema = z.object({
  nombre: z.string().trim().min(2, 'Ingresa tu nombre').max(80),
  apellido: z.string().trim().max(80),
  curso: z.string(),
  puntajeMeta: z
    .string()
    .refine((v) => v === '' || (Number.isInteger(Number(v)) && Number(v) >= 100 && Number(v) <= 1000), 'Entre 100 y 1000'),
});
type Datos = z.infer<typeof esquema>;

export function SeccionCuenta() {
  const usuario = useSesion((s) => s.usuario)!;
  const actualizar = useActualizarPerfil();
  const subir = useSubirAvatar();
  const archivoRef = useRef<HTMLInputElement>(null);
  const [colegio, setColegio] = useState<OpcionCombobox | null>(usuario.colegio ? etiquetaColegio(usuario.colegio) : null);
  const [busquedaColegio, setBusquedaColegio] = useState('');
  const colegios = useColegios(useDebounce(busquedaColegio));

  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isDirty },
  } = useForm<Datos>({
    resolver: zodResolver(esquema),
    defaultValues: {
      nombre: usuario.nombre,
      apellido: usuario.apellido ?? '',
      curso: usuario.curso ?? '',
      puntajeMeta: usuario.puntajeMeta ? String(usuario.puntajeMeta) : '',
    },
  });
  const colegioCambio = (colegio?.id ?? null) !== (usuario.colegio?.id ?? null);

  const enviar = handleSubmit(async (d) => {
    try {
      const u = await actualizar.mutateAsync({
        nombre: d.nombre,
        apellido: d.apellido || null,
        curso: d.curso || null,
        colegioId: colegio?.id ?? null,
        puntajeMeta: d.puntajeMeta ? Number(d.puntajeMeta) : null,
      });
      reset({ nombre: u.nombre, apellido: u.apellido ?? '', curso: u.curso ?? '', puntajeMeta: u.puntajeMeta ? String(u.puntajeMeta) : '' });
      toast.success('Guardamos los cambios de tu cuenta.');
    } catch (e) {
      toast.error(aplicarErroresApi(e, setError, ['nombre', 'apellido', 'curso', 'puntajeMeta']));
    }
  });

  async function alElegirArchivo(archivo: File | undefined) {
    if (!archivo) return;
    if (!archivo.type.startsWith('image/')) return toast.error('Elige una imagen (JPG, PNG o WebP).');
    if (archivo.size > MAX_AVATAR_MB * 1024 * 1024) return toast.error(`La imagen pesa más de ${MAX_AVATAR_MB} MB.`);
    try {
      await subir.mutateAsync(archivo);
      toast.success('Actualizamos tu foto de perfil.');
    } catch (e) {
      toast.error(aplicarErroresApi(e, setError, []));
    } finally {
      if (archivoRef.current) archivoRef.current.value = '';
    }
  }

  const nombreCompleto = [usuario.nombre, usuario.apellido].filter(Boolean).join(' ');

  return (
    <form onSubmit={enviar} noValidate>
      <PanelSeccion
        titulo="Cuenta"
        descripcion="Tus datos personales y tu meta. Los usamos para personalizar tu plan."
        pie={
          <Button type="submit" disabled={!isDirty && !colegioCambio} cargando={actualizar.isPending} textoCargando="Guardando…">
            Guardar cambios
          </Button>
        }
      >
        <div className="flex flex-wrap items-center gap-5">
          <Avatar nombre={nombreCompleto} url={urlArchivo(usuario.avatarUrl)} tamano="xl" />
          <div>
            <p className="text-body-md font-semibold text-on-surface">Foto de perfil</p>
            <p className="text-caption text-on-surface-variant">JPG, PNG o WebP, hasta {MAX_AVATAR_MB} MB.</p>
            <input
              ref={archivoRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="sr-only"
              id="archivo-avatar"
              onChange={(e) => void alElegirArchivo(e.target.files?.[0])}
            />
            <Button
              variante="secundario"
              tamano="sm"
              className="mt-2"
              iconoIzquierdo="photo_camera"
              cargando={subir.isPending}
              onClick={() => archivoRef.current?.click()}
            >
              Cambiar foto
            </Button>
          </div>
        </div>

        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          <Input label="Nombre" autoComplete="given-name" error={errors.nombre?.message} {...register('nombre')} />
          <Input label="Apellido" opcional autoComplete="family-name" error={errors.apellido?.message} {...register('apellido')} />
          <Input
            label="Correo electrónico"
            value={usuario.email}
            readOnly
            disabled
            hint="Para cambiar tu correo, escríbenos desde Ayuda."
          />
          <Select
            label="Curso"
            placeholder="Elige tu curso"
            opciones={CURSOS.map((c) => ({ valor: c, etiqueta: c }))}
            error={errors.curso?.message}
            {...register('curso')}
          />
          <Combobox
            className="sm:col-span-2"
            label="Colegio"
            placeholder="Busca tu colegio o comuna…"
            icono="school"
            valor={colegio}
            onSeleccionar={setColegio}
            opciones={(colegios.data ?? []).map(etiquetaColegio)}
            busqueda={busquedaColegio}
            onBusquedaChange={setBusquedaColegio}
            cargando={colegios.isFetching}
          />
        </div>

        <div className="mt-8 rounded-md bg-surface-container-low p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <Icono nombre="track_changes" className="mt-0.5 text-xl text-primary" />
              <div>
                <p className="text-body-md font-semibold text-on-surface">{usuario.carrera?.nombre ?? 'Sin carrera definida'}</p>
                <p className="text-caption text-on-surface-variant">{usuario.universidad?.nombre ?? 'Elige una carrera y universidad para afinar tu plan.'}</p>
              </div>
            </div>
            <Link to="/onboarding/meta" className="inline-flex min-h-11 items-center gap-1 rounded px-2 text-label-md font-medium text-primary hover:underline">
              Cambiar meta
              <Icono nombre="arrow_forward" className="text-base" />
            </Link>
          </div>
          <Input
            contenedorClassName="mt-4 max-w-xs"
            label="Puntaje meta"
            type="number"
            inputMode="numeric"
            min={100}
            max={1000}
            hint="Escala PAES de 100 a 1000."
            error={errors.puntajeMeta?.message}
            {...register('puntajeMeta')}
          />
        </div>
      </PanelSeccion>
    </form>
  );
}
