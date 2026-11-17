import "server-only"

import { getCurrentUser } from "@/lib/auth"

import type { PriceContext } from "./types"

export type { Audiencia, Precio, PriceContext } from "./types"

/**
 * La costura del proyecto: catálogo público y catálogo de clientes comparten
 * rutas, shell y componentes — lo único que varía es de dónde sale el precio
 * (y algunas preferencias de visualización).
 *
 * Resuelve ese contexto UNA vez por request, en el servidor, a partir de la
 * sesión. Toda consulta de productos lo recibe como argumento explícito en
 * vez de leer la sesión por su cuenta: así una query es pura respecto a la
 * audiencia, se puede cachear por `listaPrecioId`, y es imposible que un
 * módulo filtre precios de cliente en la superficie pública por olvidarse de
 * comprobar la sesión.
 *
 * Sin sesión → `publico`. Con sesión de cliente → su lista negociada. Con
 * sesión de Entra (personal JDH) → `empleado`: el catálogo se pide al API con
 * el JWT del usuario, que lleva el claim `empleado`, y el API añade
 * `precioEmpleado` a cada producto. Suplantar a un cliente (`clienteId` por
 * parámetro) aún no está implementado.
 */
export async function getPriceContext(): Promise<PriceContext> {
  const user = await getCurrentUser()

  if (user?.empleado) {
    return {
      audiencia: "empleado",
      clienteId: null,
      listaPrecioId: null,
      mostrarIva: true,
    }
  }

  if (!user?.clienteId) {
    return {
      audiencia: "publico",
      clienteId: null,
      listaPrecioId: null,
      mostrarIva: true,
    }
  }

  return {
    audiencia: "cliente",
    clienteId: user.clienteId,
    listaPrecioId: user.listaPrecioId,
    mostrarIva: user.preferenciaMostrarIva,
  }
}

/**
 * Clave de caché estable para el contexto. Úsala en `cacheTag()` / en las
 * query keys de TanStack Query para que el precio público y el de cada lista
 * no se contaminen entre sí.
 */
export function priceCacheKey(context: PriceContext): string {
  if (context.audiencia === "empleado") return "precios:empleado"
  return context.listaPrecioId
    ? `precios:lista:${context.listaPrecioId}`
    : "precios:publico"
}
