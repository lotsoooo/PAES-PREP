import type { DTOEstadoSuscripcion, DTOPago, DTOPlanSuscripcion, DTOResultadoCheckout, DTOSuscripcion } from '@paes-pro/shared';
import { checkoutSandboxSchema, confirmarWebpaySchema } from '@paes-pro/shared';
import { sql, aIso, aIsoONull } from '../db/client.js';
import { config } from '../config.js';
import { crearRouter, requiereSesion, usuarioDe } from '../http/app.js';
import { conflicto, HttpError, noEncontrado } from '../http/errores.js';
import { leerCuerpo } from '../http/validar.js';
import { proveedorPagos, DIAS_PLAN, DIAS_PRUEBA, MODO_PAGOS } from '../services/pagos/index.js';
import { notificar } from '../services/actividad.js';
import { limitarIntentos } from '../services/limite.js';
import type { TransactionSql } from 'postgres';

export const premium = crearRouter();

premium.use('*', requiereSesion);

interface FilaPlan {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  precio_clp: number;
  ensayos_mes: number;
  analytics_avanzados: boolean;
  video_premium: boolean;
  destacado: boolean;
}

const aPlan = (p: FilaPlan): DTOPlanSuscripcion => ({
  id: p.id,
  codigo: p.codigo,
  nombre: p.nombre,
  descripcion: p.descripcion,
  precioClp: p.precio_clp,
  ensayosMes: p.ensayos_mes,
  analyticsAvanzados: p.analytics_avanzados,
  videoPremium: p.video_premium,
  destacado: p.destacado,
});

async function planPorCodigo(codigo: string): Promise<FilaPlan | undefined> {
  const [p] = await sql<FilaPlan[]>`
    select id, codigo, nombre, descripcion, precio_clp, ensayos_mes, analytics_avanzados, video_premium, destacado
      from planes_suscripcion where codigo = ${codigo} and activo`;
  return p;
}

const REF_PRUEBA = (usuarioId: string) => `PRUEBA-${usuarioId}`;

async function estado(usuarioId: string): Promise<DTOEstadoSuscripcion> {
  const [s] = await sql<(FilaPlan & { sus_id: string; estado: 'activa' | 'cancelada' | 'vencida'; inicia_en: unknown; termina_en: unknown; cancelada_en: unknown })[]>`
    select s.id as sus_id, s.estado, s.inicia_en, s.termina_en, s.cancelada_en,
           ps.id, ps.codigo, ps.nombre, ps.descripcion, ps.precio_clp, ps.ensayos_mes,
           ps.analytics_avanzados, ps.video_premium, ps.destacado
      from suscripciones s join planes_suscripcion ps on ps.id = s.plan_id
     where s.usuario_id = ${usuarioId} and s.estado = 'activa'
       and (s.termina_en is null or s.termina_en > now())
       and ps.codigo in ('premium', 'anual')
       and (${config.NODE_ENV !== 'production'} or (s.proveedor = 'webpay' and exists (
         select 1 from pagos p where p.usuario_id = s.usuario_id and p.estado = 'aprobado'
           and p.payload_respuesta->>'ambientePago' = 'real'
           and p.payload_respuesta->>'suscripcionId' = s.id::text
       )))
     order by s.inicia_en desc limit 1`;
  const [prueba] = await sql`select 1 from pagos where referencia = ${REF_PRUEBA(usuarioId)}`;
  const basico = await planPorCodigo('basico');

  const suscripcion: DTOSuscripcion | null = s
    ? {
        id: s.sus_id,
        estado: s.estado,
        plan: aPlan(s),
        iniciaEn: aIso(s.inicia_en),
        terminaEn: aIsoONull(s.termina_en),
        canceladaEn: aIsoONull(s.cancelada_en),
      }
    : null;

  return {
    esPremium: Boolean(s),
    planActual: s ? aPlan(s) : aPlan(basico!),
    suscripcion,
    pruebaDisponible: config.NODE_ENV !== 'production' && ['simulado', 'integracion'].includes(MODO_PAGOS) && !prueba && !s,
    proveedor: config.PAYMENT_PROVIDER,
    modoPago: MODO_PAGOS,
    pagosDisponibles: proveedorPagos() !== null,
    diasPrueba: DIAS_PRUEBA,
  };
}

/**
 * Activa o extiende Premium. Si ya hay una suscripción premium vigente se
 * suman los días; si solo existe el plan básico activo, se cierra.
 */
async function activarPremium(tx: TransactionSql, usuarioId: string, planId: string, dias: number): Promise<string> {
  const proveedor = proveedorPagos()?.nombre ?? config.PAYMENT_PROVIDER;
    const [vigente] = await tx<{ id: string; codigo: string; verificada: boolean }[]>`
      select s.id, ps.codigo, exists (
        select 1 from pagos p where p.usuario_id = s.usuario_id and p.estado = 'aprobado'
          and p.payload_respuesta->>'ambientePago' = 'real'
          and p.payload_respuesta->>'suscripcionId' = s.id::text
      ) as verificada from suscripciones s join planes_suscripcion ps on ps.id = s.plan_id
       where s.usuario_id = ${usuarioId} and s.estado = 'activa' for update of s`;
    if (vigente && ['premium', 'anual'].includes(vigente.codigo) && (config.NODE_ENV !== 'production' || vigente.verificada)) {
      await tx`
        update suscripciones
           set plan_id = ${planId}, proveedor = ${proveedor}, cancelada_en = null,
               termina_en = greatest(coalesce(termina_en, now()), now()) + make_interval(days => ${dias})
         where id = ${vigente.id}`;
      return vigente.id;
    }
    if (vigente) {
      await tx`
        update suscripciones set estado = 'cancelada', cancelada_en = now(), termina_en = now()
         where id = ${vigente.id}`;
    }
    const [nueva] = await tx<{ id: string }[]>`
      insert into suscripciones (usuario_id, plan_id, estado, proveedor, inicia_en, termina_en)
      values (${usuarioId}, ${planId}, 'activa', ${proveedor}, now(), now() + make_interval(days => ${dias})) returning id`;
    return nueva!.id;
}

function referenciaNueva(): string {
  return `PP-${crypto.randomUUID().replaceAll('-', '').slice(0, 23)}`;
}

async function aprobarPago(pagoId: string, usuarioId: string, payload: Record<string, unknown>): Promise<boolean> {
  // Un único commit registra el pago y concede el beneficio. Bloquear el usuario
  // también serializa compras distintas y pruebas simultáneas de la misma cuenta.
  return sql.begin(async (tx) => {
    await tx`select id from usuarios where id = ${usuarioId} for update`;
    const [pago] = await tx<{ plan_id: string; codigo: string; estado: string }[]>`
      select p.plan_id, ps.codigo, p.estado from pagos p join planes_suscripcion ps on ps.id = p.plan_id
       where p.id = ${pagoId} and p.usuario_id = ${usuarioId} for update of p`;
    if (!pago) return false;
    if (pago.estado !== 'pendiente') return pago.estado === 'aprobado';
    const suscripcionId = await activarPremium(tx, usuarioId, pago.plan_id, DIAS_PLAN[pago.codigo] ?? 30);
    await tx`update pagos set estado = 'aprobado', confirmado_en = now(),
      payload_respuesta = ${JSON.stringify({ ...payload, ambientePago: MODO_PAGOS, suscripcionId })}::jsonb where id = ${pagoId}`;
    return true;
  });
}

async function rechazarPago(pagoId: string, payload: Record<string, unknown>): Promise<void> {
  await sql`
    update pagos set estado = 'rechazado', confirmado_en = now(), payload_respuesta = ${JSON.stringify(payload)}::jsonb
     where id = ${pagoId} and estado = 'pendiente'`;
}

interface PagoPendiente {
  id: string;
  usuario_id: string;
  estado: string;
  referencia: string;
  monto_clp: number;
  proveedor: 'mock' | 'webpay';
  modo: string | null;
  creado_en: unknown;
}

/** Confirma con la pasarela un pago identificado por su token. Idempotente. */
async function confirmarPorToken(pago: PagoPendiente, token: string, aprobar?: boolean): Promise<DTOResultadoCheckout> {
  const base = { pagoId: pago.id, redirectUrl: null, modoPago: MODO_PAGOS };
  if (pago.estado === 'aprobado') return { ...base, estado: 'aprobado', mensaje: 'Este pago ya estaba confirmado.' };
  if (pago.estado !== 'pendiente') return { ...base, estado: 'rechazado', mensaje: 'Esta transacción ya fue procesada. Si no se cobró, intenta pagar de nuevo.' };

  const proveedor = proveedorPagos();
  if (!proveedor) throw new HttpError(503, 'SERVICE_UNAVAILABLE', 'Los pagos no están habilitados en este entorno.');
  if (pago.proveedor !== proveedor.nombre || pago.modo !== MODO_PAGOS) throw conflicto('Este pago corresponde a otro ambiente. Revisa su estado antes de continuar.');
  if (MODO_PAGOS === 'simulado' && Date.now() - new Date(pago.creado_en as string).getTime() > 15 * 60_000) {
    await rechazarPago(pago.id, { ambientePago: MODO_PAGOS, motivo: 'expirado' });
    return { ...base, estado: 'rechazado', mensaje: 'La sesión de pago de prueba expiró. Puedes iniciar otra.' };
  }
  const r = await proveedor.confirmar(token, { pagoId: pago.id, referencia: pago.referencia, montoClp: pago.monto_clp }, { aprobar });
  if (r.estado === 'aprobado') {
    if (!(await aprobarPago(pago.id, pago.usuario_id, r.payload))) return { ...base, estado: 'rechazado', mensaje: 'Esta transacción ya estaba cerrada.' };
    return { ...base, estado: 'aprobado', mensaje: MODO_PAGOS === 'simulado' ? 'Pago de prueba aprobado. Premium activado en el entorno de desarrollo.' : '¡Listo! Ya eres Premium.' };
  }
  await rechazarPago(pago.id, { ...r.payload, ambientePago: MODO_PAGOS });
  const [actual] = await sql<{ estado: string }[]>`select estado from pagos where id = ${pago.id}`;
  if (actual?.estado === 'aprobado') return { ...base, estado: 'aprobado', mensaje: 'Este pago ya estaba confirmado.' };
  return { ...base, estado: 'rechazado', mensaje: r.motivo };
}

premium.get('/estado', async (c) => c.json(await estado(usuarioDe(c).id)));

/** El resultado visible siempre procede del servidor, nunca de ?estado=aprobado. */
premium.get('/pagos/:id', async (c) => {
  const id = c.req.param('id');
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) throw noEncontrado();
  const [pago] = await sql<{ estado: string; modo: string | null }[]>`
    select estado, payload_respuesta->>'ambientePago' as modo from pagos
     where id = ${id} and usuario_id = ${usuarioDe(c).id}`;
  if (!pago) throw noEncontrado('No encontramos ese pago en tu cuenta.');
  return c.json({ pagoId: id, estado: pago.estado, modoPago: pago.modo ?? 'no_disponible' });
});

premium.post('/checkout', async (c) => {
  const { id: usuarioId } = usuarioDe(c);
  limitarIntentos(`checkout:${usuarioId}`, 10, 10);
  const datos = await leerCuerpo(c, checkoutSandboxSchema);
  const proveedor = proveedorPagos();
  if (!proveedor) {
    throw new HttpError(503, 'SERVICE_UNAVAILABLE', 'Los pagos todavía no están habilitados en este ambiente.');
  }
  const plan = await planPorCodigo(datos.plan);
  if (!plan) throw noEncontrado('Ese plan no está disponible.');

  const referencia = referenciaNueva();
  const [pago] = await sql<{ id: string }[]>`
    insert into pagos (usuario_id, plan_id, estado, metodo, proveedor, monto_clp, referencia)
    values (${usuarioId}, ${plan.id}, 'pendiente', 'webpay', ${proveedor.nombre}, ${plan.precio_clp}, ${referencia})
    returning id`;

  const r = await proveedor.cobrar({
    pagoId: pago!.id,
    referencia,
    montoClp: plan.precio_clp,
    urlRetorno: `${config.API_PUBLIC_URL}/api/v1/premium/webpay/retorno`,
  });

  if (r.estado === 'rechazado') {
    await rechazarPago(pago!.id, r.payload);
    return c.json({ estado: 'rechazado', pagoId: pago!.id, mensaje: r.motivo, redirectUrl: null, modoPago: MODO_PAGOS } satisfies DTOResultadoCheckout);
  }
  await sql`
    update pagos set token_pago = ${r.tokenPago}, payload_respuesta = ${JSON.stringify({ ...r.payload, ambientePago: MODO_PAGOS })}::jsonb
     where id = ${pago!.id}`;
  return c.json({
    estado: 'redireccion',
    pagoId: pago!.id,
    mensaje: 'Te llevamos a Webpay para completar el pago.',
    redirectUrl: r.redirectUrl,
    ...(r.tokenRedireccion ? { tokenRedireccion: r.tokenRedireccion } : {}),
    modoPago: MODO_PAGOS,
  } satisfies DTOResultadoCheckout);
});

/** Confirmación desde la página sandbox de la app (o un reintento del cliente). */
premium.post('/webpay/confirmar', async (c) => {
  const { id: usuarioId } = usuarioDe(c);
  const datos = await leerCuerpo(c, confirmarWebpaySchema);
  const [pago] = await sql<PagoPendiente[]>`
    select id, usuario_id, estado, referencia, monto_clp, proveedor, creado_en, payload_respuesta->>'ambientePago' as modo from pagos
     where token_pago = ${datos.token} and usuario_id = ${usuarioId}`;
  if (!pago) throw noEncontrado('No encontramos esa transacción. Vuelve a intentar el pago desde Planes.');
  // Solo el sandbox acepta elegir el resultado; con Webpay manda Transbank.
  return c.json(await confirmarPorToken(pago, datos.token, MODO_PAGOS === 'simulado' ? datos.aprobar : undefined));
});

/**
 * Retorno de Webpay (público: Transbank redirige el navegador aquí con
 * `token_ws`, o con `TBK_TOKEN` si el estudiante anuló). Confirma en el
 * servidor y redirige a la pantalla de resultado de la app.
 */
export const premiumPublico = crearRouter();

premiumPublico.on(['GET', 'POST'], '/webpay/retorno', async (c) => {
  const form = c.req.method === 'POST' ? await c.req.parseBody().catch(() => ({}) as Record<string, unknown>) : {};
  const leer = (k: string) => {
    const v = (form as Record<string, unknown>)[k] ?? c.req.query(k);
    return typeof v === 'string' && v.length <= 128 ? v : null;
  };
  const destino = (estado: 'aprobado' | 'rechazado', pagoId?: string) =>
    c.redirect(`${config.APP_URL}/app/premium/resultado?estado=${estado}${pagoId ? `&pago=${pagoId}` : ''}`, 303);

  const token = leer('token_ws');
  const anulado = leer('TBK_TOKEN');
  const [pago] = await sql<PagoPendiente[]>`
    select id, usuario_id, estado, referencia, monto_clp, proveedor, creado_en, payload_respuesta->>'ambientePago' as modo from pagos where token_pago = ${token ?? anulado ?? ''}`;
  if (!pago) return destino('rechazado');
  if (!token) {
    await rechazarPago(pago.id, { anulado: true });
    return destino('rechazado', pago.id);
  }
  const r = await confirmarPorToken(pago, token);
  return destino(r.estado === 'aprobado' ? 'aprobado' : 'rechazado', pago.id);
});


premium.post('/prueba', async (c) => {
  const { id: usuarioId } = usuarioDe(c);
  if (config.NODE_ENV === 'production' || !['simulado', 'integracion'].includes(MODO_PAGOS)) {
    throw new HttpError(503, 'SERVICE_UNAVAILABLE', 'La prueba Premium está habilitada solo en el entorno de pruebas autorizado.');
  }
  const actual = await estado(usuarioId);
  if (actual.esPremium) throw conflicto('Ya tienes Premium activo.');
  if (!actual.pruebaDisponible) throw conflicto('Ya usaste tu prueba gratis. Puedes suscribirte cuando quieras.');
  const plan = await planPorCodigo('premium');
  // La prueba queda registrada como un pago de $0 para que solo ocurra una vez.
  if (!plan) throw noEncontrado('El plan Premium no está disponible.');
  await sql.begin(async (tx) => {
    await tx`select id from usuarios where id = ${usuarioId} for update`;
    const [previa] = await tx`select 1 from pagos where referencia = ${REF_PRUEBA(usuarioId)}`;
    if (previa) throw conflicto('Ya usaste tu prueba gratis.');
    const suscripcionId = await activarPremium(tx, usuarioId, plan.id, DIAS_PRUEBA);
    await tx`
      insert into pagos (usuario_id, plan_id, estado, metodo, proveedor, monto_clp, referencia, confirmado_en, payload_respuesta)
      values (${usuarioId}, ${plan.id}, 'aprobado', 'webpay', ${proveedorPagos()!.nombre}, 0, ${REF_PRUEBA(usuarioId)}, now(),
        ${JSON.stringify({ ambientePago: MODO_PAGOS, prueba: true, suscripcionId })}::jsonb)`;
  });
  await notificar(usuarioId, {
    tipo: 'pago',
    titulo: `Comenzó tu prueba Premium de ${DIAS_PRUEBA} días`,
    cuerpo: 'Beneficio de demostración en este entorno de pruebas. No se hará ningún cobro automático.',
    url: '/app/premium',
  }).catch(() => console.warn('[pagos] No se pudo generar la notificación de prueba.'));
  return c.json(await estado(usuarioId));
});

premium.post('/cancelar', async (c) => {
  const { id: usuarioId } = usuarioDe(c);
  const filas = await sql`
    update suscripciones s set cancelada_en = now()
      from planes_suscripcion ps
     where ps.id = s.plan_id and s.usuario_id = ${usuarioId} and s.estado = 'activa'
       and ps.codigo in ('premium', 'anual') and s.cancelada_en is null
     returning s.id`;
  if (filas.length === 0) throw conflicto('No tienes una suscripción Premium que cancelar.');
  return c.json(await estado(usuarioId));
});

premium.get('/pagos', async (c) => {
  const { id: usuarioId } = usuarioDe(c);
  const filas = await sql<{ id: string; estado: DTOPago['estado']; metodo: DTOPago['metodo']; monto_clp: number; ultimos4: string | null; nombre: string; creado_en: unknown; confirmado_en: unknown }[]>`
    select p.id, p.estado, p.metodo, p.monto_clp, p.ultimos4, ps.nombre, p.creado_en, p.confirmado_en
      from pagos p join planes_suscripcion ps on ps.id = p.plan_id
     where p.usuario_id = ${usuarioId} and p.monto_clp > 0
     order by p.creado_en desc limit 50`;
  const dto: DTOPago[] = filas.map((f) => ({
    id: f.id,
    estado: f.estado,
    metodo: f.metodo,
    montoClp: f.monto_clp,
    ultimos4: f.ultimos4,
    planNombre: f.nombre,
    creadoEn: aIso(f.creado_en),
    confirmadoEn: aIsoONull(f.confirmado_en),
  }));
  return c.json(dto);
});
