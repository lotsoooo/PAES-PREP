-- ============================================================================
-- 002 · Oferta académica: carrera × universidad con puntaje de corte
-- ----------------------------------------------------------------------------
-- Aditiva e idempotente. Puntajes de corte APROXIMADOS (escala PAES 100–1000,
-- ponderado), solo como referencia para fijar la meta en el onboarding: no
-- son la tabla oficial del DEMRE ni de cada universidad. Solo incluye
-- combinaciones que la universidad realmente imparte.
-- ============================================================================

with oferta (carrera, universidad, corte) as (
  values
    ('Medicina', 'Universidad de Chile', 905),
    ('Medicina', 'Pontificia Universidad Católica de Chile', 915),
    ('Medicina', 'Universidad de Santiago de Chile', 870),
    ('Medicina', 'Universidad de los Andes', 860),
    ('Medicina', 'Universidad de Concepción', 865),
    ('Medicina', 'Universidad Diego Portales', 835),
    ('Medicina', 'Universidad del Desarrollo', 845),

    ('Derecho', 'Universidad de Chile', 800),
    ('Derecho', 'Pontificia Universidad Católica de Chile', 815),
    ('Derecho', 'Universidad de Santiago de Chile', 720),
    ('Derecho', 'Universidad de los Andes', 700),
    ('Derecho', 'Universidad de Concepción', 700),
    ('Derecho', 'Universidad Diego Portales', 690),
    ('Derecho', 'Universidad del Desarrollo', 650),

    ('Ingeniería en Computación', 'Universidad de Chile', 800),
    ('Ingeniería en Computación', 'Pontificia Universidad Católica de Chile', 810),
    ('Ingeniería en Computación', 'Universidad Técnica Federico Santa María', 745),
    ('Ingeniería en Computación', 'Universidad de Santiago de Chile', 700),
    ('Ingeniería en Computación', 'Universidad de Concepción', 680),
    ('Ingeniería en Computación', 'Universidad Diego Portales', 640),
    ('Ingeniería en Computación', 'Universidad del Desarrollo', 630),

    ('Ingeniería Comercial', 'Universidad de Chile', 780),
    ('Ingeniería Comercial', 'Pontificia Universidad Católica de Chile', 800),
    ('Ingeniería Comercial', 'Universidad Técnica Federico Santa María', 690),
    ('Ingeniería Comercial', 'Universidad de Santiago de Chile', 690),
    ('Ingeniería Comercial', 'Universidad de los Andes', 680),
    ('Ingeniería Comercial', 'Universidad de Concepción', 650),
    ('Ingeniería Comercial', 'Universidad Diego Portales', 640),
    ('Ingeniería Comercial', 'Universidad del Desarrollo', 630),

    ('Psicología', 'Universidad de Chile', 760),
    ('Psicología', 'Pontificia Universidad Católica de Chile', 775),
    ('Psicología', 'Universidad de Santiago de Chile', 690),
    ('Psicología', 'Universidad de los Andes', 640),
    ('Psicología', 'Universidad de Concepción', 680),
    ('Psicología', 'Universidad Diego Portales', 660),
    ('Psicología', 'Universidad del Desarrollo', 610),

    ('Enfermería', 'Universidad de Chile', 770),
    ('Enfermería', 'Pontificia Universidad Católica de Chile', 780),
    ('Enfermería', 'Universidad de Santiago de Chile', 720),
    ('Enfermería', 'Universidad de los Andes', 690),
    ('Enfermería', 'Universidad de Concepción', 720),
    ('Enfermería', 'Universidad Diego Portales', 670),
    ('Enfermería', 'Universidad del Desarrollo', 660),

    ('Arquitectura', 'Universidad de Chile', 720),
    ('Arquitectura', 'Pontificia Universidad Católica de Chile', 760),
    ('Arquitectura', 'Universidad Técnica Federico Santa María', 650),
    ('Arquitectura', 'Universidad de Santiago de Chile', 650),
    ('Arquitectura', 'Universidad de Concepción', 630),
    ('Arquitectura', 'Universidad Diego Portales', 620),
    ('Arquitectura', 'Universidad del Desarrollo', 600),

    ('Veterinaria', 'Universidad de Chile', 760),
    ('Veterinaria', 'Pontificia Universidad Católica de Chile', 770),
    ('Veterinaria', 'Universidad de Concepción', 690),

    ('Nutrición y Dietética', 'Universidad de Chile', 720),
    ('Nutrición y Dietética', 'Pontificia Universidad Católica de Chile', 730),
    ('Nutrición y Dietética', 'Universidad de Concepción', 660),
    ('Nutrición y Dietética', 'Universidad del Desarrollo', 610),

    ('Trabajo Social', 'Universidad de Chile', 680),
    ('Trabajo Social', 'Pontificia Universidad Católica de Chile', 690),
    ('Trabajo Social', 'Universidad de Santiago de Chile', 640),
    ('Trabajo Social', 'Universidad de Concepción', 620),

    ('Diseño Gráfico', 'Universidad de Chile', 680),
    ('Diseño Gráfico', 'Pontificia Universidad Católica de Chile', 720),
    ('Diseño Gráfico', 'Universidad Diego Portales', 600),
    ('Diseño Gráfico', 'Universidad del Desarrollo', 580),

    ('Contabilidad', 'Universidad de Chile', 690),
    ('Contabilidad', 'Universidad de Santiago de Chile', 640),
    ('Contabilidad', 'Universidad de Concepción', 610)
)
insert into public.carreras_universidades (carrera_id, universidad_id, puntaje_corte)
select c.id, u.id, o.corte
from oferta o
join public.carreras c on c.nombre = o.carrera
join public.universidades u on u.nombre = o.universidad
on conflict (carrera_id, universidad_id) do update set puntaje_corte = excluded.puntaje_corte;
