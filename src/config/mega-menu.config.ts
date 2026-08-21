import type { NavLink } from "@/lib/navigation"

/**
 * Un grupo del mega menú. `moduleIds` trae módulos vivos del registro (su
 * ícono/título/descripción/href se resuelven en cliente); `links` agrega
 * enlaces estáticos que no son módulos. Un grupo puede usar uno, otro o ambos.
 */
export interface MegaMenuGroup {
  id: string
  title: string
  /** Ids de módulos a mostrar en este grupo (resueltos contra el registro). */
  moduleIds?: string[]
  /** Enlaces extra que no son módulos. */
  links?: NavLink[]
}

export interface MegaMenuConfig {
  groups: MegaMenuGroup[]
  /** Card destacada opcional al costado del panel. */
  featured?: {
    title: string
    description: string
    href: `/${string}`
    cta: string
  }
}

/**
 * Contenido del mega menú "Explorar todo". Es también la ÚNICA superficie de
 * navegación por debajo de `md` (ver `AppHeader`), así que debe listar todo lo
 * alcanzable. Mantener los `href` apuntando a rutas que ya existen: con
 * `typedRoutes`, una ruta faltante compila pero da 404.
 */
export const megaMenuConfig: MegaMenuConfig = {
  groups: [
    {
      id: "catalogo",
      title: "Catálogo",
      moduleIds: ["catalogo"],
    },
    {
      id: "cliente",
      title: "Para clientes",
      moduleIds: ["listas", "cuenta"],
    },
  ],
  featured: {
    title: "Precios negociados",
    description:
      "Ingresa con tu cuenta de cliente para ver los precios de tu lista y armar tus pedidos.",
    href: "/ingreso",
    cta: "Ingresar",
  },
}
