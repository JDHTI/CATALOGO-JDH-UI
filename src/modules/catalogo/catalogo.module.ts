import { Package } from "lucide-react"

import { PERMISSIONS } from "@/config/permissions"
import { defineModule } from "@/lib/modules"

/**
 * Módulo de catálogo — la superficie principal, y la única que un visitante
 * anónimo puede alcanzar por completo. `permissions` pide solo
 * `productos:read`, que `anonimo` ya tiene: así el módulo aparece en el nav
 * sin sesión.
 */
export const catalogoModule = defineModule({
  id: "catalogo",
  title: "Productos",
  description:
    "Explora el portafolio JDH por categoría, marca o código de producto.",
  href: "/productos",
  icon: Package,
  permissions: [PERMISSIONS.productos.read],
  nav: {
    section: "main",
    order: 10,
    children: [
      { label: "Todo el catálogo", href: "/productos" },
      // Sub-rutas pendientes: con `typedRoutes`, `as Route` compila pero
      // daría 404 hasta que exista la página. Descomentar al crearlas.
      // { label: "Categorías", href: "/categorias" },
      // { label: "Marcas", href: "/marcas" },
    ],
  },
})
