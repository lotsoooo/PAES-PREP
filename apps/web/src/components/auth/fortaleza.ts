import { MIN_PASSWORD_LENGTH } from '@paes-pro/shared';

/** Puntaje 0–4 de una contraseña y qué reglas cumple. */
export function evaluarPassword(password: string) {
  const reglas = {
    largo: password.length >= MIN_PASSWORD_LENGTH,
    mayusMinus: /[a-záéíóúñ]/.test(password) && /[A-ZÁÉÍÓÚÑ]/.test(password),
    numero: /\d/.test(password),
    simbolo: /[^\p{L}\d]/u.test(password),
  };
  let puntaje = Object.values(reglas).filter(Boolean).length;
  if (!reglas.largo) puntaje = Math.min(puntaje, 1);
  if (password.length >= 14 && puntaje >= 3) puntaje = 4;
  return { puntaje, reglas };
}
