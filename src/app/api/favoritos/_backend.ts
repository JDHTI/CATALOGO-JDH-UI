import "server-only"

import { NextResponse } from "next/server"

import {
  BackendUnauthenticatedError,
  backendFetch,
} from "@/lib/api/backend-fetch"

/**
 * Puente entre los route handlers de favoritos y el API del catálogo.
 *
 * Existe porque el JWT que autentica contra el API es de vida corta y no debe
 * salir del servidor (`docs/despliegue.md` §9): el navegador se autentica con
 * su cookie contra ESTA app, y esta app firma hacia el API. Aquí es donde se
 * cruzan las dos autoridades, y por eso está en un solo sitio y no repetido
 * en cada handler.
 *
 * Traduce tres situaciones a algo que el cliente sepa interpretar:
 *
 * - sin sesión → 401, y la UI esconde la interacción en vez de reintentar;
 * - `BACKEND_API_URL` sin configurar, o el API sin publicar favoritos → 501,
 *   que el cliente trata como «todavía no existe» y degrada en silencio. Se
 *   distingue del 404 del propio API porque un 404 aquí también podría ser un
 *   producto inexistente, y esos son casos distintos;
 * - cualquier otra cosa → se propaga el estado tal cual.
 */
export async function haciaElApi(
  path: `/${string}`,
  init?: RequestInit
): Promise<NextResponse> {
  if (!process.env.BACKEND_API_URL) {
    return NextResponse.json(
      { error: "Favoritos no está configurado en este entorno" },
      { status: 501 }
    )
  }

  let respuesta: Response
  try {
    respuesta = await backendFetch(path, init)
  } catch (error) {
    if (error instanceof BackendUnauthenticatedError) {
      return NextResponse.json({ error: "Sesión requerida" }, { status: 401 })
    }
    // El API caído no es lo mismo que "no implementado": 502 para que el
    // cliente NO lo confunda con degradación silenciosa.
    return NextResponse.json(
      { error: "No pudimos contactar el catálogo" },
      { status: 502 }
    )
  }

  if (respuesta.status === 204) return new NextResponse(null, { status: 204 })

  const cuerpo = await respuesta.text()
  return new NextResponse(cuerpo || null, {
    status: respuesta.status,
    headers: { "Content-Type": "application/json" },
  })
}
