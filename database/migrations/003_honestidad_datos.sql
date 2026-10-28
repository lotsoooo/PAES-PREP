-- ============================================================================
-- 003 · Datos honestos: perfiles de ejemplo y percentil con muestra mínima
-- ----------------------------------------------------------------------------
-- Aditiva e idempotente.
-- 1. `perfiles_publicos.es_demo` rotula los perfiles creados por el seed
--    (calificaciones y seguidores de ejemplo, sin verificación real).
-- 2. `percentil_ensayo` solo responde con 30 o más estudiantes distintos; con
--    menos devuelve null y la interfaz muestra "sin datos suficientes".
--    Los percentiles ya guardados se recalculan con la misma regla: es un dato
--    derivado, no información ingresada por nadie.
-- ============================================================================

alter table public.perfiles_publicos
  add column if not exists es_demo boolean not null default false;

create or replace function public.percentil_ensayo(p_ensayo uuid, p_puntaje integer)
returns numeric language sql stable as $$
  select case
           when count(distinct usuario_id) < 30 then null
           else round(
             (count(*) filter (where puntaje <= p_puntaje))::numeric * 100 / count(*), 2)
         end
  from public.intentos
   where ensayo_id = p_ensayo and estado = 'entregado' and puntaje is not null;
$$;

update public.intentos i
   set percentil = public.percentil_ensayo(i.ensayo_id, i.puntaje)
 where i.estado = 'entregado' and i.puntaje is not null and i.percentil is not null;
