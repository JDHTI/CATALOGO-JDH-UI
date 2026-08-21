import {
  LayoutDashboard,
  Package,
  Tags,
  Users,
  type LucideIcon,
} from "lucide-react"

export interface AdminNavItem {
  href: `/admin${string}`
  label: string
  icon: LucideIcon
}

/**
 * Navegación del panel de administración. Se declara aquí y NO se deriva del
 * registro de módulos a propósito: admin es otra audiencia y otra superficie
 * (el registro modela lo que ve un cliente/visitante, no lo que gestiona un
 * administrador). Las vistas admin sí consumen la misma capa de datos de cada
 * módulo.
 */
export const adminNav: AdminNavItem[] = [
  { href: "/admin", label: "Resumen", icon: LayoutDashboard },
  { href: "/admin/productos", label: "Productos", icon: Package },
  { href: "/admin/precios", label: "Listas de precios", icon: Tags },
  { href: "/admin/clientes", label: "Clientes", icon: Users },
]
