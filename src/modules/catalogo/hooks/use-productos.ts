"use client"

import { keepPreviousData, useQuery } from "@tanstack/react-query"

import {
  listarProductos,
  listarProveedores,
  obtenerProducto,
} from "../api/client"
import type { ProductosQueryParams } from "../types"

/**
 * Hooks de lectura del catálogo (endpoints públicos, sin sesión). Toda la
 * data de productos en componentes cliente pasa por aquí — nunca `fetch`
 * suelto en un `useEffect` (convención del repo).
 */

export const catalogoKeys = {
  productos: (params: ProductosQueryParams) =>
    ["catalogo", "productos", params] as const,
  producto: (id: string) => ["catalogo", "producto", id] as const,
  proveedores: ["catalogo", "proveedores"] as const,
}

/** Listado paginado. `keepPreviousData` evita el "flash" de skeleton al
 *  cambiar de página o filtro: la página anterior queda visible (atenuada
 *  por la vista vía `isPlaceholderData`) mientras llega la nueva. */
export function useProductos(params: ProductosQueryParams) {
  return useQuery({
    queryKey: catalogoKeys.productos(params),
    queryFn: () => listarProductos(params),
    placeholderData: keepPreviousData,
  })
}

/** Detalle de un producto. */
export function useProducto(id: string) {
  return useQuery({
    queryKey: catalogoKeys.producto(id),
    queryFn: () => obtenerProducto(id),
    // Un 404 no se resuelve reintentando (el id no existe).
    retry: false,
  })
}

/** Proveedores para el filtro — conjunto pequeño y estable: caché larga. */
export function useProveedores() {
  return useQuery({
    queryKey: catalogoKeys.proveedores,
    queryFn: listarProveedores,
    staleTime: 5 * 60 * 1000,
  })
}
