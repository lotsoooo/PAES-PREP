import { useInfiniteQuery, useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import type {
  DTOBusquedaComunidad,
  DTOComentarioSocial,
  DTODestacadosComunidad,
  DTOMateriaConEjes,
  DTOPerfilPublico,
  DTOPublicacionCompleta,
  DTOPublicacionFeed,
  DTOTutorResumen,
  PaginaCursor,
  TipoPublicacion,
} from '@paes-pro/shared';
import { get, post, query } from '@/lib/api';

/* --------------------------------------------------------------------------
 * Claves
 * -------------------------------------------------------------------------- */

export type OrdenFeed = 'recientes' | 'populares' | 'sin_responder' | 'siguiendo';

export interface FiltrosFeed {
  materia?: string;
  tipo?: TipoPublicacion;
  orden: OrdenFeed;
}

export interface FiltrosBusqueda {
  q: string;
  materia?: string;
  tipo?: TipoPublicacion;
  desde?: 'semana' | 'mes' | 'anio';
}

export const claveComunidad = {
  todo: ['comunidad'] as const,
  feed: (f: FiltrosFeed) => ['comunidad', 'feed', f] as const,
  detalle: (id: string) => ['comunidad', 'publicacion', id] as const,
  destacados: ['comunidad', 'destacados'] as const,
  busqueda: (f: FiltrosBusqueda) => ['comunidad', 'buscar', f] as const,
  tutor: (id: string, orden: string) => ['comunidad', 'tutor', id, orden] as const,
};

/* --------------------------------------------------------------------------
 * Lecturas
 * -------------------------------------------------------------------------- */

export function useFeed(filtros: FiltrosFeed) {
  return useInfiniteQuery({
    queryKey: claveComunidad.feed(filtros),
    queryFn: ({ pageParam }) =>
      get<PaginaCursor<DTOPublicacionFeed>>(
        `/comunidad/publicaciones${query({ ...filtros, limite: 10, cursor: pageParam })}`,
      ),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (ultima) => (ultima.hasMore ? (ultima.nextCursor ?? undefined) : undefined),
  });
}

export function useDestacados() {
  return useQuery({
    queryKey: claveComunidad.destacados,
    queryFn: () => get<DTODestacadosComunidad>('/comunidad/destacados'),
    staleTime: 120_000,
  });
}

export function usePublicacion(id: string | undefined) {
  return useQuery({
    queryKey: claveComunidad.detalle(id ?? ''),
    queryFn: () => get<DTOPublicacionCompleta>(`/comunidad/publicaciones/${id}`),
    enabled: Boolean(id),
  });
}

export function useBusquedaComunidad(filtros: FiltrosBusqueda) {
  return useQuery({
    queryKey: claveComunidad.busqueda(filtros),
    queryFn: () => get<DTOBusquedaComunidad>(`/comunidad/buscar${query({ ...filtros })}`),
    enabled: filtros.q.trim().length >= 2,
    placeholderData: (previo) => previo,
  });
}

export type DTOPerfilTutor = Omit<DTOPerfilPublico, 'publicaciones'> & { publicaciones: DTOPublicacionFeed[]; tutor: DTOTutorResumen };

export function usePerfilTutor(id: string | undefined, orden: 'recientes' | 'populares') {
  return useQuery({
    queryKey: claveComunidad.tutor(id ?? '', orden),
    queryFn: () => get<DTOPerfilTutor>(`/comunidad/tutores/${id}${query({ orden })}`),
    enabled: Boolean(id),
    placeholderData: (previo) => previo,
  });
}

/** Materias para filtros y para la categoría de una publicación. */
export function useMaterias() {
  return useQuery({
    queryKey: ['catalogo', 'materias'],
    queryFn: () => get<DTOMateriaConEjes[]>('/materias'),
    staleTime: 10 * 60_000,
  });
}

/* --------------------------------------------------------------------------
 * Parche optimista: una publicación aparece en el feed, el detalle, la
 * búsqueda, el perfil y el perfil de tutor. Se actualiza en todos a la vez.
 * -------------------------------------------------------------------------- */

type ParchePublicacion = Partial<Pick<DTOPublicacionFeed, 'likes' | 'meGusta' | 'guardada' | 'comentarios'>> & {
  totalComentarios?: number;
};

function parchar(valor: unknown, id: string, cambio: (p: Record<string, unknown>) => ParchePublicacion): unknown {
  if (Array.isArray(valor)) {
    let cambiado = false;
    const nuevo = valor.map((v) => {
      const r = parchar(v, id, cambio);
      if (r !== v) cambiado = true;
      return r;
    });
    return cambiado ? nuevo : valor;
  }
  if (valor && typeof valor === 'object') {
    const obj = valor as Record<string, unknown>;
    if (obj.id === id && 'meGusta' in obj && 'titulo' in obj) return { ...obj, ...cambio(obj) };
    let cambiado = false;
    const nuevo: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) {
      const r = parchar(v, id, cambio);
      if (r !== v) cambiado = true;
      nuevo[k] = r;
    }
    return cambiado ? nuevo : valor;
  }
  return valor;
}

const PREFIJOS = [['comunidad'], ['perfil']] as const;

function parcharEnCache(qc: QueryClient, id: string, cambio: (p: Record<string, unknown>) => ParchePublicacion) {
  for (const prefijo of PREFIJOS) {
    qc.setQueriesData({ queryKey: prefijo }, (datos: unknown) => parchar(datos, id, cambio));
  }
}

async function instantanea(qc: QueryClient) {
  await Promise.all(PREFIJOS.map((p) => qc.cancelQueries({ queryKey: p })));
  return PREFIJOS.flatMap((p) => qc.getQueriesData({ queryKey: p }));
}

function restaurar(qc: QueryClient, previo: [readonly unknown[], unknown][] | undefined) {
  for (const [clave, datos] of previo ?? []) qc.setQueryData(clave, datos);
}

/* --------------------------------------------------------------------------
 * Mutaciones
 * -------------------------------------------------------------------------- */

export function useMeGusta() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => post<{ meGusta: boolean; likes: number }>(`/comunidad/publicaciones/${id}/voto`),
    onMutate: async (id) => {
      const previo = await instantanea(qc);
      parcharEnCache(qc, id, (p) => {
        const meGusta = !p.meGusta;
        return { meGusta, likes: Math.max(0, Number(p.likes) + (meGusta ? 1 : -1)) };
      });
      return { previo };
    },
    onError: (_e, _id, ctx) => restaurar(qc, ctx?.previo),
    onSuccess: (r, id) => parcharEnCache(qc, id, () => r),
  });
}

export function useGuardar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => post<{ guardada: boolean }>(`/comunidad/publicaciones/${id}/guardar`),
    onMutate: async (id) => {
      const previo = await instantanea(qc);
      parcharEnCache(qc, id, (p) => ({ guardada: !p.guardada }));
      return { previo };
    },
    onError: (_e, _id, ctx) => restaurar(qc, ctx?.previo),
    onSuccess: (r, id) => {
      parcharEnCache(qc, id, () => r);
      void qc.invalidateQueries({ queryKey: ['perfil'] });
    },
  });
}

export function useComentar(publicacionId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (datos: { cuerpo: string; respondeAId?: string | null }) =>
      post<DTOComentarioSocial>(`/comunidad/publicaciones/${publicacionId}/comentarios`, datos),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: claveComunidad.detalle(publicacionId) });
      void qc.invalidateQueries({ queryKey: ['comunidad', 'feed'] });
    },
  });
}

export function useMeGustaComentario(publicacionId: string) {
  const qc = useQueryClient();
  const clave = claveComunidad.detalle(publicacionId);
  const alternar = (lista: DTOComentarioSocial[], id: string, r?: { meGusta: boolean; likes: number }): DTOComentarioSocial[] =>
    lista.map((c) =>
      c.id === id
        ? { ...c, ...(r ?? { meGusta: !c.meGusta, likes: Math.max(0, c.likes + (c.meGusta ? -1 : 1)) }) }
        : { ...c, respuestas: alternar(c.respuestas, id, r) },
    );
  return useMutation({
    mutationFn: (id: string) => post<{ meGusta: boolean; likes: number }>(`/comunidad/comentarios/${id}/voto`),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: clave });
      const previo = qc.getQueryData<DTOPublicacionCompleta>(clave);
      if (previo) qc.setQueryData<DTOPublicacionCompleta>(clave, { ...previo, comentarios: alternar(previo.comentarios, id) });
      return { previo };
    },
    onError: (_e, _id, ctx) => ctx?.previo && qc.setQueryData(clave, ctx.previo),
    onSuccess: (r, id) => {
      const actual = qc.getQueryData<DTOPublicacionCompleta>(clave);
      if (actual) qc.setQueryData<DTOPublicacionCompleta>(clave, { ...actual, comentarios: alternar(actual.comentarios, id, r) });
    },
  });
}

export function useMarcarMejor(publicacionId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (comentarioId: string) => post<{ ok: true }>(`/comunidad/comentarios/${comentarioId}/mejor`),
    onSuccess: () => qc.invalidateQueries({ queryKey: claveComunidad.detalle(publicacionId) }),
  });
}

export function useCrearPublicacion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (datos: { titulo: string; cuerpo: string; materiaId: string | null; tipo: TipoPublicacion }) =>
      post<DTOPublicacionFeed>('/comunidad/publicaciones', datos),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['comunidad'] });
      void qc.invalidateQueries({ queryKey: ['perfil'] });
    },
  });
}

export function useSubirImagen() {
  return useMutation({
    mutationFn: (archivo: File) => {
      const form = new FormData();
      form.append('archivo', archivo);
      return post<{ url: string }>('/comunidad/imagenes', form);
    },
  });
}

export function useSeguirTutor(tutorId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => post<{ loSigo: boolean; seguidores: number }>(`/comunidad/tutores/${tutorId}/seguir`),
    onSuccess: (r) => {
      qc.setQueriesData<DTOPerfilTutor>({ queryKey: ['comunidad', 'tutor', tutorId] }, (d) =>
        d ? { ...d, loSigo: r.loSigo, perfil: { ...d.perfil, seguidores: r.seguidores } } : d,
      );
      qc.setQueryData<DTODestacadosComunidad>(claveComunidad.destacados, (d) =>
        d ? { ...d, tutores: d.tutores.map((t) => (t.id === tutorId ? { ...t, loSigo: r.loSigo, seguidores: r.seguidores } : t)) } : d,
      );
    },
  });
}

export function useResenar(tutorId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (datos: { calificacion: number; comentario?: string }) => post(`/comunidad/tutores/${tutorId}/resenas`, datos),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['comunidad', 'tutor', tutorId] }),
  });
}

export function useReportar() {
  return useMutation({
    mutationFn: (datos: { publicacionId?: string; comentarioId?: string; motivo: string }) => post('/comunidad/reportes', datos),
  });
}
