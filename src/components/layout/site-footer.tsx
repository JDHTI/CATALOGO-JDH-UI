"use client"

import { usePathname } from "next/navigation"

import { AppFooter } from "./app-footer"

/**
 * Footer del sitio con ocultamiento por ruta. No lo muestran:
 *
 * - `/productos` — el listado es una superficie de compra que termina en su
 *   paginación.
 * - `/productos/<id>` — la ficha se dimensiona al viewport y no scrollea (ver
 *   `CatalogoPage compacta`); un footer de 401px la haría scrollear sola.
 *
 * El resto de rutas del catálogo conservan el footer negro.
 */
export function SiteFooter() {
  const pathname = usePathname()

  if (pathname.startsWith("/productos")) return null

  return <AppFooter />
}
