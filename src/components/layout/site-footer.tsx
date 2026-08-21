"use client"

import { usePathname } from "next/navigation"

import { AppFooter } from "./app-footer"

/**
 * Footer del sitio con ocultamiento por ruta: /productos NO muestra footer
 * (la página de listado es una superficie de compra que termina en su
 * paginación). El resto de rutas del catálogo conservan el footer negro.
 */
export function SiteFooter() {
  const pathname = usePathname()

  if (pathname === "/productos") return null

  return <AppFooter />
}
