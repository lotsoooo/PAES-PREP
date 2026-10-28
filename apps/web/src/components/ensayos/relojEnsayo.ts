/** El tiempo transcurrido es monótono; atrasar el reloj del equipo no suma minutos. */
export function crearRelojEnsayo(expiraEn: string, servidorAhora: string | undefined, monotonoInicial: number, relojLocalInicial: number) {
  const expira = Date.parse(expiraEn);
  const referencia = servidorAhora ? Date.parse(servidorAhora) : relojLocalInicial;
  let transcurrido = 0;
  return (monotonoActual: number) => {
    transcurrido = Math.max(transcurrido, monotonoActual - monotonoInicial, 0);
    if (!Number.isFinite(expira) || !Number.isFinite(referencia)) return 0;
    return Math.max(0, Math.ceil((expira - referencia - transcurrido) / 1000));
  };
}
