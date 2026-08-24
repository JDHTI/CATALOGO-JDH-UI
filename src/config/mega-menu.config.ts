import {
  Apple,
  Beef,
  Cookie,
  CupSoda,
  Droplet,
  type LucideIcon,
  Milk,
  PackageOpen,
  Snowflake,
  SprayCan,
  Wheat,
} from "lucide-react"

import { categoryTree } from "@/config/search.config"
import type { NavLink } from "@/lib/navigation"

/**
 * Ícono por categoría — puramente decorativo/mnemónico (mockeado junto con
 * `categoryTree`, ver `search.config.ts`), sin significado semántico más
 * allá de ayudar a reconocer la columna de un vistazo. Vive aquí (no en
 * `categoryTree`) porque `LucideIcon` es una función: este archivo solo lo
 * importa `MegaMenu`, un client component, así que nunca cruza el límite
 * server→client (ver la advertencia en `.claude/CLAUDE.md`).
 */
const CATEGORY_ICONS: Record<string, LucideIcon> = {
  "aceites-y-grasas": Droplet,
  "granos-y-cereales": Wheat,
  lacteos: Milk,
  "carnicos-y-frios": Beef,
  bebidas: CupSoda,
  "enlatados-y-conservas": PackageOpen,
  "snacks-y-confiteria": Cookie,
  "limpieza-y-aseo": SprayCan,
  "frutas-y-verduras": Apple,
  congelados: Snowflake,
}

/** Una categoría del panel: encabezado enlazado + su lista de subcategorías. */
export interface MegaMenuCategoryColumn {
  id: string
  label: string
  href: `/${string}`
  icon: LucideIcon
  subcategories: NavLink[]
}

export interface MegaMenuConfig {
  /**
   * Módulos generales (no-categoría) que abren el panel — hoy solo
   * `catalogo` ("Productos" → /productos), mostrado como acceso destacado
   * antes de la grilla de categorías.
   */
  moduleIds: string[]
  /**
   * Categoría → subcategorías, MOCKEADAS (ver `search.config.ts`). Es la
   * grilla principal del panel: cada columna es filtrable por su propia
   * categoría, con las subcategorías debajo como accesos más específicos.
   */
  categoryColumns: MegaMenuCategoryColumn[]
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
 *
 * SIN grupo "Para clientes" a propósito: los módulos `listas`/`cuenta` ya
 * exigen sesión de cliente (`listasModule`/`cuentaModule`, permisos que
 * `anonimo` no tiene) y ese login de cliente todavía no existe (ver
 * `ARCHITECTURE.md`, auth de dos proveedores) — mostrarlos hoy renderizaría
 * un encabezado sin ítems debajo, porque `MegaMenu` filtra por
 * `visibleTo(permissions)` DENTRO de cada `moduleIds`. Se reintroducen
 * cuando exista esa lógica de cliente. Mientras tanto, la card `featured` ya
 * cubre la invitación a `/ingreso`.
 */
export const megaMenuConfig: MegaMenuConfig = {
  moduleIds: ["catalogo"],
  categoryColumns: categoryTree.map((category) => ({
    id: category.value,
    label: category.label,
    href: `/productos?categoria=${category.value}`,
    icon: CATEGORY_ICONS[category.value] ?? PackageOpen,
    subcategories: category.subcategories.map((sub) => ({
      label: sub.label,
      href: `/productos?categoria=${category.value}&subcategoria=${sub.value}`,
    })),
  })),
  featured: {
    title: "Precios negociados",
    description:
      "Ingresa con tu cuenta de cliente para ver los precios de tu lista y armar tus pedidos.",
    href: "/ingreso",
    cta: "Ingresar",
  },
}
