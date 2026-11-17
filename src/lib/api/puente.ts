import "server-only"

import { NextResponse } from "next/server"

import { BackendUnauthenticatedError, backendFetch } from "./backend-fetch"

/** Respuesta personal: ni el navegador ni un proxy deben compartirla. */
export const SIN_CACHE = { "Cache-Control": "private, no-store" } as const

/**
 * Reenvía una petición del navegador al API firmándola con el JWT del usuario
 * (`backendFetch`). Es el patrón de favoritos y listas, generalizado para el
 * carrito y los pedidos: el token nunca sale del servidor y hacia el cliente
 * la autoridad es la cookie.
 *
 * - `BACKEND_API_URL` sin configurar → 501;
 * - sin sesión → 401 (el cliente esconde la interacción);
 * - API inalcanzable → 502 (distinto de «no implementado»);
 * - cualquier otra respuesta del API se propaga con su estado y su cuerpo.
 *
 * `body` es el texto crudo: el API valida, aquí no se interpreta.
 */
export async function reenviarAlApi(
  path: `/${string}`,
  { method = "GET", body }: { method?: string; body?: string } = {}
): Promise<NextResponse> {
  if (!process.env.BACKEND_API_URL) {
    return NextResponse.json(
      { message: "No configurado en este entorno" },
      { status: 501, headers: SIN_CACHE }
    )
  }

  let respuesta: Response
  try {
    respuesta = await backendFetch(path, {
      method,
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
      headers: {
        Accept: "application/json",
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      ...(body ? { body } : {}),
    })
  } catch (error) {
    if (error instanceof BackendUnauthenticatedError) {
      return NextResponse.json(
        { message: "Sesión requerida" },
        { status: 401, headers: SIN_CACHE }
      )
    }
    return NextResponse.json(
      { message: "No pudimos contactar el catálogo" },
      { status: 502, headers: SIN_CACHE }
    )
  }

  if (respuesta.status === 204) {
    return new NextResponse(null, { status: 204, headers: SIN_CACHE })
  }
  const texto = await respuesta.text()
  return new NextResponse(texto || null, {
    status: respuesta.status,
    headers: { "Content-Type": "application/json", ...SIN_CACHE },
  })
}

/** Cuerpo de la petición entrante, o `undefined` si viene vacío. */
export async function cuerpoDe(request: Request): Promise<string | undefined> {
  const texto = await request.text()
  return texto.trim() ? texto : undefined
}

/** 404 uniforme para rutas fuera de la lista blanca de un puente. */
export function rutaNoDisponible(): NextResponse {
  return NextResponse.json(
    { message: "Ruta no disponible" },
    { status: 404, headers: SIN_CACHE }
  )
}
