"use client"

import { keepPreviousData, useQuery } from "@tanstack/react-query"

import { CatalogoApiError } from "../api/errors"
import {
  listarMarcas,
  listarProductos,
  listarProveedores,
  obtenerProducto,
} from "../api/client"
import type { MarcasQueryParams, ProductosQueryParams } from "../types"

/**
 * Hooks de lectura del catálogo (endpoints públicos, sin sesión). Toda la
 * data de productos en componentes cliente pasa por aquí — nunca `fetch`
 * suelto en un `useEffect` (convención del repo).
 *
 * No hay datos de relleno en ningún nivel: cuando el API no responde, el
 * consumidor recibe `isError` y decide si muestra un estado explícito (el
 * catálogo, donde el usuario vino a ver productos) o se oculta (las
 * secciones de la homepage).
 */

export const catalogoKeys = {
  productos: (params: ProductosQueryParams) =>
    ["catalogo", "productos", params] as const,
  producto: (id: string) => ["catalogo", "producto", id] as const,
  proveedores: ["catalogo", "proveedores"] as const,
  marcas: (params: MarcasQueryParams) =>
    ["catalogo", "marcas", params] as const,
}

/** Los ejes de clasificación son conjuntos pequeños y estables frente a los
 *  ~9.000 productos: vale una caché larga. */
const CLASIFICACION_STALE_MS = 5 * 60 * 1000

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

/** Proveedores — primer eje de clasificación. */
export function useProveedores() {
  return useQuery({
    queryKey: catalogoKeys.proveedores,
    queryFn: listarProveedores,
    staleTime: CLASIFICACION_STALE_MS,
  })
}

/**
 * Marcas — segundo eje. `supplierId` las acota al proveedor seleccionado.
 *
 * `noImplementado` distingue "el backend todavía no publica /brands" (404)
 * de una caída real: con un 404 la UI oculta el eje marca en silencio en vez
 * de mostrar un error que el usuario no puede resolver.
 */
export function useMarcas(params: MarcasQueryParams = {}) {
  const query = useQuery({
    queryKey: catalogoKeys.marcas(params),
    queryFn: () => listarMarcas(params),
    staleTime: CLASIFICACION_STALE_MS,
    retry: (intento, error) =>
      error instanceof CatalogoApiError && error.statusCode === 404
        ? false
        : intento < 2,
  })

  const noImplementado =
    query.error instanceof CatalogoApiError && query.error.statusCode === 404

  return { ...query, noImplementado }
}
