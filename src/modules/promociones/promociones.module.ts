import { Tag } from "lucide-react"

import { PERMISSIONS } from "@/config/permissions"
import { defineModule } from "@/lib/modules"

/**
 * Promociones del catálogo. Sin `nav`: se alcanza desde el acceso fijo de la
 * barra inferior del header (`MainNav`), igual que favoritos desde su ícono.
 * Se registra para que su ruta y su permiso queden en el inventario de
 * módulos. Pide `productos:read`, que `anonimo` ya tiene: las promociones son
 * públicas.
 */
export const promocionesModule = defineModule({
  id: "promociones",
  title: "Promociones",
  description: "Productos con precio o condición especial por tiempo limitado.",
  href: "/promociones",
  icon: Tag,
  permissions: [PERMISSIONS.productos.read],
})
