export type EstadoGuardado = 'guardado' | 'guardando' | 'sin_conexion' | 'error';

export interface CambioRespuesta {
  alternativaId?: string | null;
  esMarcada?: boolean;
  tiempoSegundos?: number;
  baseGuardadoEn?: string | null;
}

interface OpcionesCola {
  enviar: (preguntaId: string, cambio: CambioRespuesta) => Promise<{ guardadoEn: string }>;
  persistir: (cambios: [string, CambioRespuesta][]) => void;
  alEstado: (estado: EstadoGuardado, mensaje?: string) => void;
  alCerrar: () => void;
  clasificar: (error: unknown) => 'cerrado' | 'temporal' | 'rechazado';
}

/** Una sola promesa de vaciado: entregar espera incluso si había un PUT en vuelo. */
export class ColaAutoguardado {
  private pendientes: Map<string, CambioRespuesta>;
  private revisiones: Map<string, string | null | undefined>;
  private enVuelo: Promise<boolean> | null = null;
  private cerrada = false;

  constructor(
    private opciones: OpcionesCola,
    revisiones: [string, string | null | undefined][] = [],
    iniciales: [string, CambioRespuesta][] = [],
  ) {
    this.revisiones = new Map(revisiones);
    this.pendientes = new Map(iniciales);
  }

  get cantidad() { return this.pendientes.size; }

  encolar(preguntaId: string, cambio: CambioRespuesta) {
    if (this.cerrada) return;
    const previo = this.pendientes.get(preguntaId);
    this.pendientes.set(preguntaId, {
      baseGuardadoEn: previo ? previo.baseGuardadoEn : this.revisiones.get(preguntaId),
      ...previo,
      ...cambio,
    });
    this.persistir();
  }

  vaciar(): Promise<boolean> {
    if (this.cerrada) return Promise.resolve(false);
    if (this.enVuelo) return this.enVuelo;
    this.enVuelo = this.procesar().finally(() => { this.enVuelo = null; });
    return this.enVuelo;
  }

  descartar() {
    this.cerrada = true;
    this.pendientes.clear();
    this.persistir();
  }

  private persistir() { this.opciones.persistir([...this.pendientes]); }

  private async procesar(): Promise<boolean> {
    while (!this.cerrada && this.pendientes.size > 0) {
      const [preguntaId, cambio] = this.pendientes.entries().next().value!;
      this.opciones.alEstado('guardando');
      try {
        const respuesta = await this.opciones.enviar(preguntaId, cambio);
        if (this.cerrada) return false;
        this.revisiones.set(preguntaId, respuesta.guardadoEn);
        const ultimo = this.pendientes.get(preguntaId);
        if (ultimo === cambio) this.pendientes.delete(preguntaId);
        else if (ultimo) this.pendientes.set(preguntaId, { ...ultimo, baseGuardadoEn: respuesta.guardadoEn });
        this.persistir();
      } catch (error) {
        const tipo = this.opciones.clasificar(error);
        if (tipo === 'cerrado') {
          this.descartar();
          this.opciones.alCerrar();
        } else {
          // Nunca presentar un 4xx como guardado ni eliminar respuestas rechazadas.
          this.opciones.alEstado(tipo === 'temporal' ? 'sin_conexion' : 'error',
            error instanceof Error ? error.message : 'No pudimos guardar tus respuestas.');
        }
        return false;
      }
    }
    if (this.cerrada) return false;
    this.opciones.alEstado('guardado');
    return true;
  }
}
