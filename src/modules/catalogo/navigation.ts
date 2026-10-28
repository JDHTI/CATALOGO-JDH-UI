import type { Route } from "next"
import type { Categoria, Marca, Proveedor, Subcategoria } from "./types"

/** El API anterior puede devolver marcas sin slug; el filtro sigue disponible. */
export function marcaHref(marca: Pick<Marca, "id" | "slug">): Route {
  return (
    marca.slug
      ? `/marcas/${encodeURIComponent(marca.slug)}`
      : `/productos?marca=${encodeURIComponent(marca.id)}`
  ) as Route
}

export function proveedorHref(proveedor: Pick<Proveedor, "id">): Route {
  return `/productos?proveedor=${encodeURIComponent(proveedor.id)}` as Route
}

/** Mismo vocabulario de URL que `proveedor` / `marca`: `categoria=<id>`. */
export function categoriaHref(categoria: Pick<Categoria, "id">): Route {
  return `/productos?categoria=${encodeURIComponent(categoria.id)}` as Route
}

/**
 * Lleva también la categoría padre: el panel de filtros muestra las
 * subcategorías de la categoría elegida, y sin ella el enlace caería en una
 * vista filtrada sin el contexto jerárquico.
 */
export function subcategoriaHref(
  categoria: Pick<Categoria, "id">,
  subcategoria: Pick<Subcategoria, "id">
): Route {
  return `/productos?categoria=${encodeURIComponent(categoria.id)}&subcategoria=${encodeURIComponent(subcategoria.id)}` as Route
}
