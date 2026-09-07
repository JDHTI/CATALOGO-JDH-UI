import "server-only"

import { headers } from "next/headers"

import { auth } from "@/lib/auth/server"

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Falta la variable de entorno ${name}`)
  return value
}

export class BackendUnauthenticatedError extends Error {}

/**
 * Llama al backend del catálogo como el usuario autenticado actual.
 *
 * Reenvía un **JWT de vida corta** firmado por el plugin `jwt` de Better Auth
 * (ver `src/lib/auth/server.ts`), no el token de sesión. La diferencia es de
 * arquitectura, no de formato: el backend verifica la firma contra la clave
 * pública de `GET /api/auth/jwks` y no necesita —ni debe tener— acceso a la
 * base `jdh_auth`. Antes se reenviaba el token de sesión para que el API
 * buscara la fila de `session` en ese mismo Postgres: eso obligaba a compartir
 * `BETTER_AUTH_SECRET` y las credenciales de la base, y ataba el API al
 * esquema interno de una librería de esta app.
 *
 * La cookie no viaja: son dos orígenes distintos y la petición es servidor a
 * servidor.
 *
 * Lanza `BackendUnauthenticatedError` si no hay sesión — nunca llama al backend
 * sin identidad. Para lecturas PÚBLICAS del catálogo (que son la mayoría del
 * tráfico) no uses este helper: no requieren identidad y forzarla rompería el
 * cacheado de las páginas anónimas. Añade un `publicFetch` cuando exista el
 * primer endpoint público real.
 */
export async function backendFetch(
  path: `/${string}`,
  init: RequestInit = {}
): Promise<Response> {
  const cabeceras = await headers()

  // `getToken` exige sesión (usa el `sessionMiddleware` de Better Auth): sin
  // cookie válida responde 401 y no llega a firmar nada. Se comprueba por el
  // resultado y no con un `getSession` previo, que sería una segunda lectura
  // de la sesión para saber lo mismo.
  const { token } = await auth.api
    .getToken({ headers: cabeceras })
    .catch(() => ({ token: null }))

  if (!token) throw new BackendUnauthenticatedError()

  const baseUrl = requireEnv("BACKEND_API_URL")
  return fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      ...init.headers,
      Authorization: `Bearer ${token}`,
    },
  })
}
