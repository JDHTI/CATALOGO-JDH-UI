import { Heart } from "lucide-react"

import { PERMISSIONS } from "@/config/permissions"
import { defineModule } from "@/lib/modules"

/**
 * Lista de favoritos del cliente. Sin `nav`: se alcanza desde el ícono
 * dedicado de la segunda barra (`IconNavLink`), no desde el mega menú ni el
 * nav horizontal — igual se registra para que exista un único inventario de
 * módulos y su permiso quede declarado junto a los demás.
 */
export const favoritosModule = defineModule({
  id: "favoritos",
  title: "Favoritos",
  description: "Productos que guardaste para más adelante.",
  href: "/favoritos",
  icon: Heart,
  permissions: [PERMISSIONS.favoritos.read],
})
