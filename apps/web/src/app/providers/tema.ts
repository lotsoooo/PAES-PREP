import { createContext, useContext } from 'react';
import type { Tema } from '@paes-pro/shared';

/**
 * Contexto y hook del tema, separados del componente provider para no romper el
 * fast refresh de Vite (un archivo que exporta componentes solo debe exportar
 * componentes).
 */
export interface ContextoTema {
  /** Tema efectivo ya resuelto: 'claro' o 'oscuro'. */
  tema: 'claro' | 'oscuro';
  /** Preferencia guardada por el usuario, que puede ser 'sistema'. */
  preferencia: Tema;
  setPreferencia: (tema: Tema) => void;
}

export const TemaContext = createContext<ContextoTema | null>(null);

export function useTheme(): ContextoTema {
  const ctx = useContext(TemaContext);
  if (!ctx) throw new Error('useTheme debe usarse dentro de <ThemeProvider>');
  return ctx;
}
