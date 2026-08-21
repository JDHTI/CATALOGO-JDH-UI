/**
 * Nombre por defecto de la cookie de sesión de Better Auth
 * (`better-auth.session_token`, o con el prefijo `__Secure-` en producción
 * HTTPS) — ver `node_modules/better-auth/dist/cookies/index.mjs`. No hay
 * `cookiePrefix`/`cookieName` personalizados en `src/lib/auth/server.ts`.
 *
 * Sin `server-only`: lo usa `proxy.ts` (edge/middleware, no puede importar
 * `server-only`) además de Server Components y el route handler de auth.
 */
const SESSION_COOKIE_SUBSTRING = ".session_token="

/**
 * Comprueba la sola PRESENCIA de la cookie de sesión, sin validarla.
 *
 * Un visitante anónimo (la mayoría del tráfico del catálogo) no manda esa
 * cookie, así que no hay nada que verificar contra la base de datos — se
 * puede resolver "sin sesión" sin tocar Postgres. Esto es lo que evita que
 * cada carga de página anónima dispare una consulta real mientras la
 * infraestructura de datos no está definida (ver ARCHITECTURE.md).
 */
export function hasSessionCookie(
  cookieHeader: string | null | undefined
): boolean {
  return Boolean(cookieHeader?.includes(SESSION_COOKIE_SUBSTRING))
}
