import "server-only"

/** Sin URL del API no hay a dónde enviar: el llamador lo traduce a un mensaje. */
export class PublicFetchNoConfiguradoError extends Error {}

/** Un formulario no puede quedarse colgado esperando a un API caído. */
const TIMEOUT_MS = 8000

/**
 * Llama al backend del catálogo SIN identidad, desde el servidor: para los
 * endpoints públicos de escritura (hoy, `POST /contact-leads` del formulario
 * de contacto del homepage). Es el `publicFetch` que anticipaba
 * `backend-fetch.ts`.
 *
 * Por qué no `backendFetch`: ese exige sesión y firma un JWT, y quien deja
 * sus datos en el homepage casi nunca la tiene. Por qué no desde el
 * navegador: la llamada sale de una Server Action, así que la validación del
 * esquema corre en el servidor y la URL interna del API no se expone.
 *
 * La base es `BACKEND_API_URL` (red interna, como `backendFetch`); en local,
 * donde suele faltar, cae a `NEXT_PUBLIC_API_URL` si es absoluta, igual que
 * las lecturas del catálogo en el servidor.
 */
export async function publicFetch(
  path: `/${string}`,
  init: RequestInit = {}
): Promise<Response> {
  const base = baseUrl()
  if (!base) throw new PublicFetchNoConfiguradoError()
  return fetch(`${base}${path}`, {
    ...init,
    cache: "no-store",
    signal: init.signal ?? AbortSignal.timeout(TIMEOUT_MS),
  })
}

function baseUrl(): string | null {
  const interna = process.env.BACKEND_API_URL
  // Mismo default que `resolverApiBaseUrl` del catálogo.
  const publica =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1"
  const base = interna || (publica.startsWith("/") ? null : publica)
  return base ? base.replace(/\/+$/, "") : null
}
