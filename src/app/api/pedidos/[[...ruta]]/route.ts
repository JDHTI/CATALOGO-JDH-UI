import { reenviarAlApi, rutaNoDisponible } from "@/lib/api/puente"

/**
 * Puente de los pedidos del empleado: `GET /api/pedidos` → `/orders` (los
 * últimos 50) y `GET /api/pedidos/:id` → `/orders/:id`. Solo lectura: el
 * pedido se crea en `POST /api/carrito/finalizar`.
 */
type Contexto = { params: Promise<{ ruta?: string[] }> }

export async function GET(_request: Request, { params }: Contexto) {
  const ruta = (await params).ruta ?? []
  if (ruta.length === 0) return reenviarAlApi("/orders")
  if (ruta.length === 1 && ruta[0]) {
    return reenviarAlApi(`/orders/${encodeURIComponent(ruta[0])}`)
  }
  return rutaNoDisponible()
}
