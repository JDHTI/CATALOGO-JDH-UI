import { z } from "zod"

import type {
  ImagenProducto,
  Marca,
  Paginado,
  Producto,
  Proveedor,
} from "../types"

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
  // Acordado con el backend, aún no publicado: nullish para que la
  // respuesta actual (sin el campo) siga validando.
  logoUrl: z.string().nullish(),
})

/** `GET /brands` → marcas con id propio (tabla normalizada en el backend). */
export const marcaDtoSchema = z.object({
  id: idSchema,
  nombre: z.string(),
  totalProductos: z.number().nullish(),
  logoUrl: z.string().nullish(),
})

const categoriaDtoSchema = z.object({
  id: idSchema,
  nombre: z.string(),
})

// `imagenes` es reciente: nullish para que responda tanto un backend viejo
// (sin el campo) como uno nuevo con la galería vacía.
const imagenProductoDtoSchema = z.object({
  thumbUrl: z.string(),
  cardUrl: z.string(),
  fullUrl: z.string(),
  alt: z.string().nullish(),
  position: z.number(),
  esPrincipal: z.boolean(),
})

export const productoDtoSchema = z.object({
  id: idSchema,
  sku: z.string(),
  nombre: z.string(),
  descripcion: z.string().nullish(),
  descripcionLarga: z.string().nullish(),
  seo: z
    .object({
      title: z.string().nullish(),
      description: z.string().nullish(),
    })
    .nullish(),
  marca: z.string().nullish(),
  fabricante: z.string().nullish(),
  proveedor: proveedorDtoSchema,
  categoria: categoriaDtoSchema.nullish(),
  subcategoria: categoriaDtoSchema.nullish(),
  imagenUrl: z.string().nullish(),
  imagenUrlFallback: z.string().nullish(),
  imagenes: z.array(imagenProductoDtoSchema).nullish(),
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

/** `GET /suppliers` → lista completa, sin meta. */
export const proveedoresDtoSchema = z.array(proveedorDtoSchema)

/** `GET /brands` → lista completa, sin meta. */
export const marcasDtoSchema = z.array(marcaDtoSchema)

/** Error estándar de NestJS. */
export const apiErrorDtoSchema = z.object({
  statusCode: z.number(),
  message: z.union([z.string(), z.array(z.string())]),
  error: z.string().optional(),
})

export type ProductoDto = z.infer<typeof productoDtoSchema>
export type ProveedorDto = z.infer<typeof proveedorDtoSchema>
export type MarcaDto = z.infer<typeof marcaDtoSchema>

/* ——— Mappers DTO → dominio ——— */

export function aProveedor(dto: ProveedorDto): Proveedor {
  return {
    id: dto.id,
    nombre: dto.nombre,
    ...(dto.totalProductos != null && { totalProductos: dto.totalProductos }),
    logoUrl: dto.logoUrl ?? null,
  }
}

export function aMarca(dto: MarcaDto): Marca {
  return {
    id: dto.id,
    nombre: dto.nombre,
    ...(dto.totalProductos != null && { totalProductos: dto.totalProductos }),
    logoUrl: dto.logoUrl ?? null,
  }
}

function aImagenProducto(
  dto: z.infer<typeof imagenProductoDtoSchema>
): ImagenProducto {
  return {
    thumbUrl: dto.thumbUrl,
    cardUrl: dto.cardUrl,
    fullUrl: dto.fullUrl,
    alt: dto.alt ?? null,
    position: dto.position,
    esPrincipal: dto.esPrincipal,
  }
}

export function aProducto(dto: ProductoDto): Producto {
  return {
    id: dto.id,
    sku: dto.sku,
    nombre: dto.nombre,
    descripcion: dto.descripcion ?? "",
    descripcionLarga: dto.descripcionLarga?.trim() || null,
    seo: {
      title: dto.seo?.title?.trim() || null,
      description: dto.seo?.description?.trim() || null,
    },
    marca: dto.marca ?? "",
    fabricante: dto.fabricante ?? "",
    proveedor: aProveedor(dto.proveedor),
    categoria: dto.categoria ?? null,
    subcategoria: dto.subcategoria ?? null,
    imagenUrl: dto.imagenUrl ?? null,
    imagenUrlFallback: dto.imagenUrlFallback ?? null,
    imagenes: (dto.imagenes ?? []).map(aImagenProducto),
  }
}

export function aPaginaProductos(
  dto: z.infer<typeof paginaProductosDtoSchema>
): Paginado<Producto> {
  return { data: dto.data.map(aProducto), meta: dto.meta }
}
