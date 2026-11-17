import { NextResponse, type NextRequest } from "next/server"

import {
  BackendUnauthenticatedError,
  backendFetch,
} from "@/lib/api/backend-fetch"

/**
 * `GET /api/productos[/destacados | /:id]` — los mismos `/products*` del API,
 * pedidos COMO el usuario (JWT de `backendFetch`). Existe para el precio de
 * empleados: el API solo añade `precioEmpleado` a un token con el claim
 * `empleado: true`, y ese token no debe llegar al navegador. Mismo puente que
 * favoritos y listas: hacia el cliente la autoridad es la cookie.
 *
 * Solo lo usa el catálogo cuando la sesión es de empleado
 * (`useFuenteProductos`); anónimos y clientes siguen pidiendo directo al API
 * público, que es cacheable. Si lo llama otra sesión no pasa nada: el API
 * responde sin el campo, igual que al público.
 *
 * Los parámetros de consulta se reenvían tal cual: el API los valida.
 *
 * Estados:
 * - sin sesión → 401; `BACKEND_API_URL` sin configurar → 501; API caído →
 *   502. El cliente trata los tres cayendo al API público, sin precio.
 * - cualquier otra respuesta del API se propaga con su estado.
 */
type Contexto = { params: Promise<{ ruta?: string[] }> }

/** Solo las tres formas de `/products` que el catálogo pide. */
function rutaDelApi(ruta: string[] = []): `/${string}` | null {
  if (ruta.length === 0) return "/products"
  if (ruta.length === 1 && ruta[0]) {
    return `/products/${encodeURIComponent(ruta[0])}`
  }
  return null
}

/** Respuesta personal: ni el navegador ni un proxy deben compartirla. */
const SIN_CACHE = { "Cache-Control": "private, no-store" }

export async function GET(request: NextRequest, { params }: Contexto) {
  const path = rutaDelApi((await params).ruta)
  if (!path) {
    return NextResponse.json(
      { error: "Ruta no disponible" },
      { status: 404, headers: SIN_CACHE }
    )
  }
  if (!process.env.BACKEND_API_URL) {
    return NextResponse.json(
      { error: "Precio de empleados no configurado en este entorno" },
      { status: 501, headers: SIN_CACHE }
    )
  }

  const query = request.nextUrl.searchParams.toString()
  let respuesta: Response
  try {
    respuesta = await backendFetch(`${path}${query ? `?${query}` : ""}`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    })
  } catch (error) {
    if (error instanceof BackendUnauthenticatedError) {
      return NextResponse.json(
        { error: "Sesión requerida" },
        { status: 401, headers: SIN_CACHE }
      )
    }
    return NextResponse.json(
      { error: "No pudimos contactar el catálogo" },
      { status: 502, headers: SIN_CACHE }
    )
  }

  return new NextResponse(await respuesta.text(), {
    status: respuesta.status,
    headers: { "Content-Type": "application/json", ...SIN_CACHE },
  })
}
