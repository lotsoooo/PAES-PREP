import { useCallback, useEffect, useRef, useState } from 'react';
import { guardarRespuestaSchema, type DTOPregunta } from '@paes-pro/shared';
import { ApiError } from '@/lib/api';
import { guardarRespuesta } from '@/lib/data/ensayos';
import { ColaAutoguardado, type CambioRespuesta, type EstadoGuardado } from './colaAutoguardado';

export type { EstadoGuardado } from './colaAutoguardado';
const claveCola = (id: string) => `paes-pro:autoguardado:v1:${id}`;

export function recuperarCambios(id: string, preguntas: DTOPregunta[]): [string, CambioRespuesta][] {
  try {
    const valor: unknown = JSON.parse(localStorage.getItem(claveCola(id)) ?? '[]');
    if (!Array.isArray(valor) || valor.length > preguntas.length) return [];
    const permitidas = new Map(preguntas.map((p) => [p.id, new Set(p.alternativas.map((a) => a.id))]));
    return valor.flatMap((entrada: unknown) => {
      if (!Array.isArray(entrada) || entrada.length !== 2 || typeof entrada[0] !== 'string') return [];
      const opciones = permitidas.get(entrada[0]);
      const datos = guardarRespuestaSchema.safeParse(entrada[1]);
      if (!opciones || !datos.success || (datos.data.alternativaId && !opciones.has(datos.data.alternativaId))) return [];
      return [[entrada[0], datos.data] as [string, CambioRespuesta]];
    });
  } catch { return []; }
}

/** Cola persistida por intento, reintentos de red y conflicto explícito entre pestañas. */
export function useAutoguardado(
  intentoId: string,
  preguntas: DTOPregunta[],
  iniciales: [string, CambioRespuesta][],
  alExpirar: () => void,
) {
  const [estado, setEstado] = useState<EstadoGuardado>(iniciales.length ? 'guardando' : 'guardado');
  const [error, setError] = useState<string | null>(null);
  const [respaldoLocal, setRespaldoLocal] = useState(true);
  const alExpirarRef = useRef(alExpirar);
  alExpirarRef.current = alExpirar;
  const montado = useRef(false);
  const [cola] = useState(() => new ColaAutoguardado({
    enviar: (preguntaId, cambio) => guardarRespuesta(intentoId, preguntaId, cambio),
    persistir: (cambios) => {
      try {
        if (cambios.length) localStorage.setItem(claveCola(intentoId), JSON.stringify(cambios));
        else localStorage.removeItem(claveCola(intentoId));
        if (montado.current) setRespaldoLocal(true);
      } catch { if (montado.current) setRespaldoLocal(false); }
    },
    alEstado: (nuevo, mensaje) => {
      if (!montado.current) return;
      setEstado(nuevo);
      setError(mensaje ?? null);
    },
    alCerrar: () => { if (montado.current) alExpirarRef.current(); },
    clasificar: (e) => {
      if (!(e instanceof ApiError) || e.status === 0 || e.status >= 500 || e.status === 429) return 'temporal';
      const detalles = e.details as { estado?: string } | null;
      if (e.status === 409 && detalles?.estado && ['entregado', 'expirado', 'abandonado'].includes(detalles.estado)) return 'cerrado';
      return 'rechazado';
    },
  }, preguntas.map((p) => [p.id, p.respuestaActual ? p.respuestaActual.guardadoEn : null]), iniciales));

  const vaciar = useCallback(() => cola.vaciar(), [cola]);
  const encolar = useCallback((preguntaId: string, cambio: CambioRespuesta) => {
    cola.encolar(preguntaId, cambio);
    void cola.vaciar();
  }, [cola]);
  const descartar = useCallback(() => cola.descartar(), [cola]);

  useEffect(() => {
    montado.current = true;
    void cola.vaciar();
    const alSalir = (e: BeforeUnloadEvent) => {
      if (cola.cantidad) { e.preventDefault(); e.returnValue = ''; }
    };
    const alVolverRed = () => void cola.vaciar();
    window.addEventListener('beforeunload', alSalir);
    window.addEventListener('online', alVolverRed);
    return () => {
      montado.current = false;
      window.removeEventListener('beforeunload', alSalir);
      window.removeEventListener('online', alVolverRed);
    };
  }, [cola]);

  useEffect(() => {
    if (estado !== 'sin_conexion') return;
    const id = setTimeout(() => void cola.vaciar(), 4000);
    return () => clearTimeout(id);
  }, [cola, estado]);

  return { estado, error, respaldoLocal, encolar, vaciar, descartar };
}
