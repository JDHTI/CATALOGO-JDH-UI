import { z } from "zod"

import type { Paginado, Producto, Proveedor } from "../types"

/**
 * DTOs de jdh-catalogo-api (NestJS) — contrato PROVISIONAL validado con zod
 * en la frontera. Los schemas son deliberadamente tolerantes (nullish en los
 * campos de texto, ids coercionados a string) y los mappers de abajo
 * normalizan hacia los tipos de dominio de `types.ts`: si el backend renombra
 * o afina un campo, el ajuste vive SOLO en este archivo.
 */

const idSchema = z.coerce.string()

export const proveedorDtoSchema = z.object({
  id: idSchema,
  nombre: z.string(),
  // Solo lo envía GET /suppliers; embebido en producto no viaja.
  totalProductos: z.number().nullish(),
})

const categoriaDtoSchema = z.object({
  id: idSchema,
  nombre: z.string(),
})

export const productoDtoSchema = z.object({
  id: idSchema,
  sku: z.string(),
  nombre: z.string(),
  descripcion: z.string().nullish(),
  marca: z.string().nullish(),
  fabricante: z.string().nullish(),
  proveedor: proveedorDtoSchema,
  categoria: categoriaDtoSchema.nullish(),
  subcategoria: categoriaDtoSchema.nullish(),
  imagenUrl: z.string().nullish(),
})

export const paginacionMetaDtoSchema = z.object({
  page: z.number(),
  limit: z.number(),
  total: z.number(),
  totalPages: z.number(),
})

/** `GET /products` → `{ data, meta }`. */
export const paginaProductosDtoSchema = z.object({
  data: z.array(productoDtoSchema),
  meta: paginacionMetaDtoSchema,
})

/** `GET /suppliers` → lista completa, sin meta (conjunto pequeño). */
export const proveedoresDtoSchema = z.array(proveedorDtoSchema)

/** Error estándar de NestJS. */
export const apiErrorDtoSchema = z.object({
  statusCode: z.number(),
  message: z.union([z.string(), z.array(z.string())]),
  error: z.string().optional(),
})

export type ProductoDto = z.infer<typeof productoDtoSchema>
export type ProveedorDto = z.infer<typeof proveedorDtoSchema>

/* ——— Mappers DTO → dominio ——— */

export function aProveedor(dto: ProveedorDto): Proveedor {
  return {
    id: dto.id,
    nombre: dto.nombre,
    ...(dto.totalProductos != null && { totalProductos: dto.totalProductos }),
  }
}

export function aProducto(dto: ProductoDto): Producto {
  return {
    id: dto.id,
    sku: dto.sku,
    nombre: dto.nombre,
    descripcion: dto.descripcion ?? "",
    marca: dto.marca ?? "",
    fabricante: dto.fabricante ?? "",
    proveedor: aProveedor(dto.proveedor),
    categoria: dto.categoria ?? null,
    subcategoria: dto.subcategoria ?? null,
    imagenUrl: dto.imagenUrl ?? null,
  }
}

export function aPaginaProductos(
  dto: z.infer<typeof paginaProductosDtoSchema>
): Paginado<Producto> {
  return { data: dto.data.map(aProducto), meta: dto.meta }
}
