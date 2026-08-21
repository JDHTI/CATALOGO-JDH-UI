export interface CatalogoCategoryOption {
  value: string
  label: string
}

/**
 * Categorías MOCKEADAS PARCIALMENTE — solo lo necesario para poder maquetar
 * el dropdown del buscador y los accesos destacados del header antes de que
 * exista un backend real. `ProductSearchBar` navega a
 * `/productos?categoria=<value>`; el módulo `catalogo` (vacío mientras se
 * rediseña el listado, ver `src/modules/catalogo/components/catalogo-view.tsx`)
 * todavía no interpreta ese parámetro.
 *
 * Cuando exista el backend, sustituir esta lista por las categorías reales
 * (o un hook que las resuelva) sin tocar los componentes que la consumen.
 */
export const searchCategoryOptions: CatalogoCategoryOption[] = [
  { value: "todas", label: "Todas las categorías" },
  { value: "aceites-y-grasas", label: "Aceites y grasas" },
  { value: "granos-y-cereales", label: "Granos y cereales" },
  { value: "lacteos", label: "Lácteos" },
  { value: "carnicos-y-frios", label: "Cárnicos y fríos" },
  { value: "bebidas", label: "Bebidas" },
  { value: "enlatados-y-conservas", label: "Enlatados y conservas" },
  { value: "snacks-y-confiteria", label: "Snacks y confitería" },
  { value: "limpieza-y-aseo", label: "Limpieza y aseo" },
]

/** Subconjunto sin "todas", para los accesos rápidos de la barra de categorías. */
export const featuredCategoryLinks: CatalogoCategoryOption[] =
  searchCategoryOptions.filter((option) => option.value !== "todas")
