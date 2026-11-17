import { cuerpoDe, reenviarAlApi, rutaNoDisponible } from "@/lib/api/puente"

/**
 * Puente del carrito de EMPLEADOS hacia `/cart*` del API, con el JWT del
 * usuario. El API exige el claim `empleado` (sin token 401, cliente 403).
 *
 * Lista blanca explícita: cada ruta de aquí tiene exactamente un destino.
 *
 * | Aquí                               | API                               |
 * | ---------------------------------- | --------------------------------- |
 * | GET, DELETE `/api/carrito`         | `/cart`                           |
 * | POST, PUT, DELETE `…/items/:id`    | `/cart/items/:id`                 |
 * | POST `…/desde-lista/:listaId`      | `/cart/from-list/:listaId`        |
 * | GET, POST `…/finalizar`            | `/cart/checkout`                  |
 */
type Contexto = { params: Promise<{ ruta?: string[] }> }

const METODOS: Record<string, readonly string[]> = {
  "": ["GET", "DELETE"],
  items: ["POST", "PUT", "DELETE"],
  "desde-lista": ["POST"],
  finalizar: ["GET", "POST"],
}

function destino(ruta: string[], method: string): `/${string}` | null {
  const [seccion = "", id, ...resto] = ruta
  if (resto.length > 0 || !METODOS[seccion]?.includes(method)) return null
  switch (seccion) {
    case "":
      return "/cart"
    case "items":
      return id ? `/cart/items/${encodeURIComponent(id)}` : null
    case "desde-lista":
      return id ? `/cart/from-list/${encodeURIComponent(id)}` : null
    case "finalizar":
      return id === undefined ? "/cart/checkout" : null
    default:
      return null
  }
}

async function manejar(request: Request, { params }: Contexto) {
  const path = destino((await params).ruta ?? [], request.method)
  if (!path) return rutaNoDisponible()
  return reenviarAlApi(path, {
    method: request.method,
    body: request.method === "GET" ? undefined : await cuerpoDe(request),
  })
}

export const GET = manejar
export const POST = manejar
export const PUT = manejar
export const DELETE = manejar
