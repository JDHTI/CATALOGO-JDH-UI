import { ClipboardList } from "lucide-react"

import { PERMISSIONS } from "@/config/permissions"
import { defineModule } from "@/lib/modules"

/**
 * Listas de pedido / cotización que un cliente arma desde el catálogo. Solo
 * visible con sesión (`listas:read` no lo tiene `anonimo`): un visitante
 * público puede ver precios, pero no acumular una lista.
 */
export const listasModule = defineModule({
  id: "listas",
  title: "Mis listas",
  description: "Arma listas de pedido y cotiza con tu asesor.",
  href: "/listas",
  icon: ClipboardList,
  permissions: [PERMISSIONS.listas.read],
  nav: {
    section: "main",
    order: 20,
  },
})
