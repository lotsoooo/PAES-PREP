/**
 * Textos públicos centralizados (landing y centro de ayuda).
 */

export const PREGUNTAS_FRECUENTES: { id: string; pregunta: string; respuesta: string }[] = [
  {
    id: 'ensayos',
    pregunta: '¿Cómo funcionan los ensayos?',
    respuesta:
      'Simulan las condiciones reales de la PAES: mismo número de preguntas, 4 alternativas, cronómetro y temario vigente del DEMRE. Cada respuesta se guarda sola, así que si se corta la conexión retomas donde quedaste.',
  },
  {
    id: 'celular',
    pregunta: '¿Puedo estudiar desde mi celular?',
    respuesta:
      'Sí. La plataforma está pensada para el teléfono: el modo examen tiene alternativas grandes, navegador de preguntas y funciona igual de bien que en el computador.',
  },
  {
    id: 'puntaje',
    pregunta: '¿El puntaje estimado es el oficial?',
    respuesta:
      'No. Es una aproximación en la escala PAES de 100 a 1000 calculada con una tabla de conversión propia. El DEMRE publica la conversión oficial de cada proceso; nuestra estimación sirve para medir tu avance entre ensayos.',
  },
  {
    id: 'plan',
    pregunta: '¿Cómo se arma mi plan de estudio?',
    respuesta:
      'Con tu meta (carrera y universidad), las pruebas que rendirás, tus horas disponibles y tus resultados. El plan dedica más tiempo a las pruebas donde la distancia a tu meta es mayor y se reajusta después de cada ensayo.',
  },
  {
    id: 'gratis',
    pregunta: '¿Qué incluye el plan gratis?',
    respuesta:
      'Un ensayo completo al mes, plan de estudio, contenidos esenciales, cuaderno de errores y la comunidad. Premium suma ensayos ilimitados, explicaciones en video, analítica avanzada y el tutor IA.',
  },
  {
    id: 'cancelar',
    pregunta: '¿Puedo cancelar Premium cuando quiera?',
    respuesta:
      'Sí, desde Configuración → Suscripción. Mantienes el acceso hasta el fin del período pagado y no se renueva.',
  },
];

/**
 * Testimonios reales con consentimiento de sus autores. La sección de la
 * landing solo se muestra cuando hay al menos uno: no se publican citas
 * inventadas (D-024).
 */
export const TESTIMONIOS: { cita: string; autor: string; detalle: string }[] = [];
