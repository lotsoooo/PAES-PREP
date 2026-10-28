export interface ItemNavegacion {
  to: string;
  etiqueta: string;
  /** Etiqueta corta para la barra inferior móvil. */
  corta?: string;
  icono: string;
  /** Coincidencia exacta (solo para el inicio). */
  exacto?: boolean;
}

/** Navegación principal del AppShell (sidebar de escritorio). */
export const NAV_PRINCIPAL: ItemNavegacion[] = [
  { to: '/app', etiqueta: 'Inicio', icono: 'dashboard', exacto: true },
  { to: '/app/ensayos', etiqueta: 'Mis ensayos', icono: 'assignment' },
  { to: '/app/contenidos', etiqueta: 'Contenidos', icono: 'menu_book' },
  { to: '/app/plan', etiqueta: 'Plan de estudio', icono: 'calendar_today' },
  { to: '/app/repaso', etiqueta: 'Repaso de errores', icono: 'autorenew' },
  { to: '/app/estadisticas', etiqueta: 'Estadísticas', icono: 'analytics' },
  { to: '/app/comunidad', etiqueta: 'Comunidad', icono: 'groups' },
];

/** Barra inferior móvil: Inicio · Ensayos · Estudio · Comunidad · Perfil. */
export const NAV_MOVIL: ItemNavegacion[] = [
  { to: '/app', etiqueta: 'Inicio', icono: 'home', exacto: true },
  { to: '/app/ensayos', etiqueta: 'Ensayos', icono: 'edit_document' },
  { to: '/app/plan', etiqueta: 'Estudio', icono: 'auto_stories' },
  { to: '/app/comunidad', etiqueta: 'Comunidad', icono: 'group' },
  { to: '/app/perfil', etiqueta: 'Perfil', icono: 'person' },
];

/** Las rutas de "Estudio" en móvil agrupan plan, contenidos y repaso. */
export const RUTAS_ESTUDIO = ['/app/plan', '/app/contenidos', '/app/repaso', '/app/estadisticas'];

/** Destinos de la paleta de comandos (Ctrl/⌘ + K). */
export const ATAJOS_PALETA: { to: string; etiqueta: string; icono: string; palabras: string }[] = [
  ...NAV_PRINCIPAL.map((n) => ({ to: n.to, etiqueta: n.etiqueta, icono: n.icono, palabras: n.etiqueta })),
  { to: '/app/perfil', etiqueta: 'Mi perfil', icono: 'person', palabras: 'perfil cuenta logros' },
  { to: '/app/notificaciones', etiqueta: 'Notificaciones', icono: 'notifications', palabras: 'avisos alertas' },
  { to: '/app/configuracion/cuenta', etiqueta: 'Configuración', icono: 'settings', palabras: 'ajustes cuenta contraseña tema' },
  { to: '/app/configuracion/apariencia', etiqueta: 'Apariencia y tema oscuro', icono: 'dark_mode', palabras: 'modo oscuro claro tema' },
  { to: '/app/premium', etiqueta: 'Planes Premium', icono: 'workspace_premium', palabras: 'premium pago suscripción' },
  { to: '/app/comunidad/nuevo', etiqueta: 'Crear publicación', icono: 'edit', palabras: 'publicar pregunta duda' },
];
