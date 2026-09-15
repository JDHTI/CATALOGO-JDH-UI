"use client"

import { usePathname } from "next/navigation"

import { AppFooter } from "./app-footer"

/**
 * Footer del sitio con ocultamiento por ruta. No lo muestran:
 * - `/listas` — el editor termina en la paginación de sus productos.
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

  if (pathname.startsWith("/productos") || pathname === "/listas") return null

  return <AppFooter />
}
