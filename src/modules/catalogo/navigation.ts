import type { Route } from "next"
import type { Marca, Proveedor } from "./types"

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
