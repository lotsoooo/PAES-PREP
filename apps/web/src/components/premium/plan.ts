import { create } from 'zustand';
import { useSesion } from '@/app/sesion';

/* Gating Premium: un solo hook y un solo modal para toda la app. */

interface EstadoUpgrade {
  abierto: boolean;
  motivo: string | null;
  abrir: (motivo?: string) => void;
  cerrar: () => void;
}

export const useModalUpgrade = create<EstadoUpgrade>((set) => ({
  abierto: false,
  motivo: null,
  abrir: (motivo) => set({ abierto: true, motivo: motivo ?? null }),
  cerrar: () => set({ abierto: false }),
}));

/** Plan del usuario y acceso a funciones Premium. */
export function usePlan() {
  const usuario = useSesion((s) => s.usuario);
  const abrir = useModalUpgrade((s) => s.abrir);
  const esPremium = Boolean(usuario?.esPremium);
  return {
    esPremium,
    planActual: usuario?.planActual ?? 'basico',
    /** Ejecuta `accion` si es Premium; si no, abre el modal de upgrade. */
    conPremium: (motivo: string, accion: () => void) => {
      if (esPremium) accion();
      else abrir(motivo);
    },
    pedirUpgrade: abrir,
  };
}
