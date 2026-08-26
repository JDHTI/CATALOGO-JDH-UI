import type { z } from "zod"

import type {
  Paginado,
  Producto,
  ProductosQueryParams,
  Proveedor,
} from "../types"
import {
  aPaginaProductos,
  aProducto,
  apiErrorDtoSchema,
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
 */

import {
  listarProductosMock,
  listarProveedoresMock,
  obtenerProductoMock,
} from "../mock/productos.mock"
import { CatalogoApiError } from "./errors"

export { CatalogoApiError }

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api/v1"

/** Switch mock/API real. Se evalúa en build (NEXT_PUBLIC_*): con "1" el
 *  catálogo funciona completo sin backend; se apaga cuando jdh-catalogo-api
 *  publique los endpoints reales. */
const USAR_MOCK = process.env.NEXT_PUBLIC_CATALOGO_MOCK === "1"

async function apiGet<Schema extends z.ZodType>(
  path: `/${string}`,
  schema: Schema,
  params?: Record<string, string | number | undefined>
): Promise<z.infer<Schema>> {
  const url = new URL(`${API_BASE_URL}${path}`)
  for (const [clave, valor] of Object.entries(params ?? {})) {
    if (valor !== undefined && valor !== "") {
      url.searchParams.set(clave, String(valor))
    }
  }

  const respuesta = await fetch(url, {
    headers: { Accept: "application/json" },
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
  params: ProductosQueryParams = {}
): Promise<Paginado<Producto>> {
  if (USAR_MOCK) return listarProductosMock(params)
  const dto = await apiGet("/products", paginaProductosDtoSchema, {
    page: params.page,
    limit: params.limit,
    search: params.search,
    supplierId: params.supplierId,
  })
  return aPaginaProductos(dto)
}

/** `GET /products/:id` — detalle de un producto. */
export async function obtenerProducto(id: string): Promise<Producto> {
  if (USAR_MOCK) return obtenerProductoMock(id)
  const dto = await apiGet(
    `/products/${encodeURIComponent(id)}`,
    productoDtoSchema
  )
  return aProducto(dto)
}

/** `GET /suppliers` — lista completa de proveedores (para el filtro). */
export async function listarProveedores(): Promise<Proveedor[]> {
  if (USAR_MOCK) return listarProveedoresMock()
  const dto = await apiGet("/suppliers", proveedoresDtoSchema)
  return dto.map((p) => ({ id: p.id, nombre: p.nombre }))
}
