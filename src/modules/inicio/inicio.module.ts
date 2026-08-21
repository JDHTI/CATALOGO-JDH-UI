import { Home } from "lucide-react"

import { PERMISSIONS } from "@/config/permissions"
import { defineModule } from "@/lib/modules"

/**
 * Módulo de inicio — la portada del catálogo, compartida entre visitantes
 * anónimos y clientes con sesión. Mismo permiso que catálogo
 * (`productos:read`, que `anonimo` ya tiene) para que el nav lo muestre
 * sin sesión. No lee sesión ni PriceContext: solo precios públicos de ejemplo.
 */
export const inicioModule = defineModule({
  id: "inicio",
  title: "Inicio",
  description:
    "Portada del catálogo JDH: propuesta de valor, categorías, productos destacados y proveedores.",
  href: "/",
  icon: Home,
  permissions: [PERMISSIONS.productos.read],
  nav: {
    section: "main",
    order: 0,
  },
})
