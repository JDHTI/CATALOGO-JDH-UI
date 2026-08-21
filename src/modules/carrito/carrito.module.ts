import { ShoppingCart } from "lucide-react"

import { PERMISSIONS } from "@/config/permissions"
import { defineModule } from "@/lib/modules"

/**
 * Carrito de compras. Distinto de `listas` ("Mis listas", cotizaciones
 * guardadas): el carrito es la selección de cara al checkout. Sin `nav`: se
 * alcanza desde el ícono dedicado de la segunda barra.
 */
export const carritoModule = defineModule({
  id: "carrito",
  title: "Carrito de compras",
  description: "Productos listos para tu próximo pedido.",
  href: "/carrito",
  icon: ShoppingCart,
  permissions: [PERMISSIONS.carrito.read],
})
