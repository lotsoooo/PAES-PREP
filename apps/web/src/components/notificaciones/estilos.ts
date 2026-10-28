/**
 * Ícono y color por tipo (Stitch: resultados, recordatorio, material nuevo,
 * plataforma). El color acompaña al ícono y al título; nunca va solo.
 */
export const ESTILO_NOTIFICACION: Record<string, { icono: string; clase: string; etiqueta: string }> = {
  resultados_disponibles: { icono: 'workspace_premium', clase: 'bg-primary-fixed text-primary', etiqueta: 'Resultados' },
  recordatorio: { icono: 'alarm', clase: 'bg-secondary-fixed text-secondary', etiqueta: 'Recordatorio' },
  material_nuevo: { icono: 'auto_stories', clase: 'bg-success-container text-success', etiqueta: 'Material nuevo' },
  nuevo_plan: { icono: 'calendar_month', clase: 'bg-primary-fixed text-primary', etiqueta: 'Plan de estudio' },
  plan_actualizado: { icono: 'event_repeat', clase: 'bg-primary-fixed text-primary', etiqueta: 'Plan de estudio' },
  racha: { icono: 'local_fire_department', clase: 'bg-secondary-fixed text-secondary-container', etiqueta: 'Racha' },
  comentario: { icono: 'chat_bubble', clase: 'bg-surface-container-high text-on-surface-variant', etiqueta: 'Comunidad' },
  respuesta: { icono: 'forum', clase: 'bg-surface-container-high text-on-surface-variant', etiqueta: 'Comunidad' },
  like: { icono: 'thumb_up', clase: 'bg-surface-container-high text-on-surface-variant', etiqueta: 'Comunidad' },
  pago: { icono: 'credit_card', clase: 'bg-tertiary-fixed text-tertiary', etiqueta: 'Pago' },
  sistema: { icono: 'info', clase: 'bg-surface-container-high text-on-surface-variant', etiqueta: 'Plataforma' },
};
