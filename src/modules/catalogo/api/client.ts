import type { z } from "zod"

import type {
  Marca,
  MarcasQueryParams,
  Paginado,
  Producto,
  ProductosQueryParams,
  Proveedor,
} from "../types"
import {
  aMarca,
  aPaginaProductos,
  aProducto,
  aProveedor,
  apiErrorDtoSchema,
  marcasDtoSchema,
  paginaProductosDtoSchema,
  productoDtoSchema,
  proveedoresDtoSchema,
} from "../schemas/api"

/**
 * Cliente del API público del catálogo (jdh-catalogo-api). Corre igual en
 * navegador y en servidor — endpoints PÚBLICOS, sin sesión: para llamadas
 * autenticadas existe `src/lib/api/backend-fetch.ts`, no este cliente.
 *
 * Cada respuesta se valida con zod y se traduce a dominio en `schemas/api.ts`;
 * los componentes nunca ven el DTO crudo.
 *
 * NO hay datos de relleno: esta es la única fuente de productos de la UI. Si
 * el backend no responde, las vistas muestran su estado de error o se
 * ocultan — nunca productos inventados.
 */

import { CatalogoApiError } from "./errors"

export { CatalogoApiError }

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api/v1"

/**
 * `signal` viene del `queryFn` de TanStack Query, que lo aborta cuando la
 * consulta queda obsoleta (el componente se desmonta, o llega un término de
 * búsqueda más nuevo). Sin él, teclear "coca cola" deja tres peticiones vivas
 * compitiendo por pintar el mismo panel: trabajo que el backend ya hizo para
 * nada y, con muchos usuarios simultáneos, carga puramente desperdiciada.
 */
async function apiGet<Schema extends z.ZodType>(
  path: `/${string}`,
  schema: Schema,
  params?: Record<string, string | number | undefined>,
  signal?: AbortSignal
): Promise<z.infer<Schema>> {
  const url = new URL(`${API_BASE_URL}${path}`)
  for (const [clave, valor] of Object.entries(params ?? {})) {
    if (valor !== undefined && valor !== "") {
      url.searchParams.set(clave, String(valor))
    }
  }

  const respuesta = await fetch(url, {
    headers: { Accept: "application/json" },
    signal,
  })

  if (!respuesta.ok) {
    // Formato de error estándar de NestJS; si no matchea, cae al statusText.
    const cuerpo = apiErrorDtoSchema.safeParse(
      await respuesta.json().catch(() => null)
    )
    const mensaje = cuerpo.success
      ? [cuerpo.data.message].flat().join(", ")
      : respuesta.statusText
    throw new CatalogoApiError(respuesta.status, mensaje)
  }

  return schema.parse(await respuesta.json())
}

/** `GET /products` — listado paginado con búsqueda y filtro por proveedor. */
export async function listarProductos(
  params: ProductosQueryParams = {},
  signal?: AbortSignal
): Promise<Paginado<Producto>> {
  const dto = await apiGet(
    "/products",
    paginaProductosDtoSchema,
    {
      page: params.page,
      limit: params.limit,
      search: params.search,
      supplierId: params.supplierId,
      brandId: params.brandId,
    },
    signal
  )
  return aPaginaProductos(dto)
}

/** `GET /products/:id` — detalle de un producto. */
export async function obtenerProducto(
  id: string,
  signal?: AbortSignal
): Promise<Producto> {
  const dto = await apiGet(
    `/products/${encodeURIComponent(id)}`,
    productoDtoSchema,
    undefined,
    signal
  )
  return aProducto(dto)
}

/** `GET /suppliers` — lista completa de proveedores (para el filtro). */
export async function listarProveedores(
  signal?: AbortSignal
): Promise<Proveedor[]> {
  const dto = await apiGet(
    "/suppliers",
    proveedoresDtoSchema,
    undefined,
    signal
  )
  return dto.map(aProveedor)
}

/**
 * `GET /brands` — lista completa de marcas, opcionalmente acotada a un
 * proveedor. Segundo eje de clasificación del catálogo, junto al proveedor.
 */
export async function listarMarcas(
  params: MarcasQueryParams = {},
  signal?: AbortSignal
): Promise<Marca[]> {
  const dto = await apiGet(
    "/brands",
    marcasDtoSchema,
    { supplierId: params.supplierId },
    signal
  )
  return dto.map(aMarca)
}
