import { create } from 'zustand';
import type { DTOPregunta, DTOUsuario } from '@paes-pro/shared';

/* ==========================================================================
 * Sesión del usuario — estado cliente mínimo (no es estado servidor).
 * Los datos del usuario se resuelven con TanStack Query en `auth.*`.
 * ========================================================================== */

interface EstadoSesion {
  usuario: DTOUsuario | null;
  acceso: string | null;
  initializing: boolean;
  setSesion: (usuario: DTOUsuario | null, acceso: string | null) => void;
  setAcceso: (acceso: string | null) => void;
  actualizarUsuario: (parcial: Partial<DTOUsuario>) => void;
  limpiar: () => void;
}

export const useSesion = create<EstadoSesion>((set) => ({
  usuario: null,
  acceso: null,
  initializing: true,
  setSesion: (usuario, acceso) => set({ usuario, acceso, initializing: false }),
  setAcceso: (acceso) => set({ acceso }),
  actualizarUsuario: (parcial) =>
    set((estado) => ({
      usuario: estado.usuario ? { ...estado.usuario, ...parcial } : null,
    })),
  limpiar: () => set({ usuario: null, acceso: null, initializing: false }),
}));

/* ==========================================================================
 * Ensayo en curso — Zustand. Contiene las respuestas para poder navegar
 * sin refetch en cada cambio de pregunta. El servidor sigue siendo la
 * autoridad (autoguardado + expira_en).
 * ========================================================================== */

export interface EstadoIntento {
  intentoId: string | null;
  ensayoSlug: string | null;
  expiraEn: string | null;
  indiceActual: number;
  preguntas: DTOPregunta[];
  /** alternativaId elegida por preguntaId. */
  respuestas: Record<string, string>;
  /** preguntaId -> marcada para revisar. */
  marcadas: Record<string, boolean>;
  /** preguntaId -> segundos acumulados. */
  tiempos: Record<string, number>;
  envioPendiente: boolean;
  setIntento: (datos: {
    intentoId: string;
    ensayoSlug: string;
    expiraEn: string;
    preguntas: DTOPregunta[];
    indiceActual?: number;
  }) => void;
  setIndice: (indice: number) => void;
  responder: (preguntaId: string, alternativaId: string) => void;
  alternarMarcada: (preguntaId: string) => void;
  acumularTiempo: (preguntaId: string, segundos: number) => void;
  marcarEnviando: (valor: boolean) => void;
  limpiar: () => void;
}

export const useIntento = create<EstadoIntento>((set) => ({
  intentoId: null,
  ensayoSlug: null,
  expiraEn: null,
  indiceActual: 0,
  preguntas: [],
  respuestas: {},
  marcadas: {},
  tiempos: {},
  envioPendiente: false,

  setIntento: ({ intentoId, ensayoSlug, expiraEn, preguntas, indiceActual = 0 }) => {
    // Rehidrata el store desde la respuesta autoritativa del servidor.
    const respuestas: Record<string, string> = {};
    const marcadas: Record<string, boolean> = {};
    const tiempos: Record<string, number> = {};
    for (const p of preguntas) {
      if (p.respuestaActual?.alternativaId) respuestas[p.id] = p.respuestaActual.alternativaId;
      if (p.respuestaActual?.esMarcada) marcadas[p.id] = true;
      if (p.respuestaActual?.tiempoSegundos) tiempos[p.id] = p.respuestaActual.tiempoSegundos;
    }
    set({ intentoId, ensayoSlug, expiraEn, preguntas, indiceActual, respuestas, marcadas, tiempos });
  },

  setIndice: (indice) => set({ indiceActual: indice }),

  responder: (preguntaId, alternativaId) =>
    set((estado) => ({
      respuestas: { ...estado.respuestas, [preguntaId]: alternativaId },
    })),

  alternarMarcada: (preguntaId) =>
    set((estado) => ({
      marcadas: { ...estado.marcadas, [preguntaId]: !estado.marcadas[preguntaId] },
    })),

  acumularTiempo: (preguntaId, segundos) =>
    set((estado) => ({
      tiempos: { ...estado.tiempos, [preguntaId]: segundos },
    })),

  marcarEnviando: (valor) => set({ envioPendiente: valor }),

  limpiar: () =>
    set({
      intentoId: null,
      ensayoSlug: null,
      expiraEn: null,
      indiceActual: 0,
      preguntas: [],
      respuestas: {},
      marcadas: {},
      tiempos: {},
      envioPendiente: false,
    }),
}));

/* ==========================================================================
 * UI — panel de preguntas y banner de la biblioteca
 * ========================================================================== */

type PanelIntentos = 'cerrado' | 'grid' | 'lista';

interface EstadoUI {
  panelIntentos: PanelIntentos;
  filtroArea: string | null;
  abrirPanel: () => void;
  cerrarPanel: () => void;
  setFiltroArea: (area: string | null) => void;
}

export const useUI = create<EstadoUI>((set) => ({
  panelIntentos: 'cerrado',
  filtroArea: null,
  abrirPanel: () => set({ panelIntentos: 'grid' }),
  cerrarPanel: () => set({ panelIntentos: 'cerrado' }),
  setFiltroArea: (area) => set({ filtroArea: area }),
}));
