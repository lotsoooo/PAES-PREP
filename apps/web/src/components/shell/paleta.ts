import { create } from 'zustand';

interface EstadoPaleta {
  abierta: boolean;
  setAbierta: (v: boolean) => void;
}

export const usePaleta = create<EstadoPaleta>((set) => ({
  abierta: false,
  setAbierta: (abierta) => set({ abierta }),
}));
