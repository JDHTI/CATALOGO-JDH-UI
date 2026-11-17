import { z } from "zod"

import type {
  Categoria,
  CategoriaProducto,
  ImagenProducto,
  Marca,
  Paginado,
  PrecioEmpleado,
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

/**
 * `GET /brands` y `GET /brands/:slug` → marcas con id propio (tabla
 * normalizada en el backend). `slug` es reciente: nullish para que un API
 * anterior siga validando.
 */
export const marcaDtoSchema = z.object({
  id: idSchema,
  slug: z.string().nullish(),
  nombre: z.string(),
  totalProductos: z.number().nullish(),
  logoUrl: z.string().nullish(),
})

// Embebida en el producto. `slug` es nullish por un API anterior a la
// categorización, que enviaba solo `{ id, nombre }`.
const categoriaDtoSchema = z.object({
  id: idSchema,
  nombre: z.string(),
  slug: z.string().nullish(),
})

const subcategoriaArbolDtoSchema = z.object({
  id: idSchema,
  slug: z.string(),
  nombre: z.string(),
  totalProductos: z.number(),
})

/** `GET /categories` y `GET /categories/:slug` → categoría con su árbol. */
export const categoriaArbolDtoSchema = z.object({
  id: idSchema,
  slug: z.string(),
  nombre: z.string(),
  totalProductos: z.number(),
  subcategorias: z.array(subcategoriaArbolDtoSchema),
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

/**
 * Lista de precios de EMPLEADOS. Pesos ENTEROS sin centavos (el mapper los
 * pasa a centavos). Solo viaja con un JWT `empleado: true`.
 */
const precioEmpleadoDtoSchema = z.object({
  precio: z.number(),
  precioConIva: z.number(),
  // 19, 5 o 0 (0 = Sin IVA, se factura al 0 %); null = tasa DESCONOCIDA.
  // Son cosas distintas: comparar siempre contra null, nunca por falsedad.
  ivaPct: z.number().nullable(),
  // «IVA 19 %», «IVA 5 %», «Sin IVA» o «IVA por confirmar». Nullish para
  // que un API anterior al campo siga validando (el mapper la deriva).
  ivaEtiqueta: z.string().nullish(),
  // String y no `literal("COP")`: una moneda inesperada en UN producto no
  // debe tumbar el parseo de la página entera. El mapper la descarta.
  moneda: z.string(),
  unidad: z.string().nullish(),
  fechaFoto: z.string(),
})

export const productoDtoSchema = z.object({
  id: idSchema,
  sku: z.string(),
  nombre: z.string(),
  // `descripcion` es el nombre del API, pero su contenido es un código de
  // referencia del ERP; el dominio lo expone como `referencia` para no
  // confundirlo con `descripcionLarga`, que sí es texto editorial.
  descripcion: z.string().nullish(),
  descripcionLarga: z.string().nullish(),
  seo: z
    .object({
      title: z.string().nullish(),
      description: z.string().nullish(),
    })
    .nullish(),
  marca: z.string().nullish(),
  // Pedido al API, aún no publicado: nullish para que la respuesta actual
  // (solo el nombre en `marca`) siga validando.
  marcaId: idSchema.nullish(),
  fabricante: z.string().nullish(),
  proveedor: proveedorDtoSchema,
  categoria: categoriaDtoSchema.nullish(),
  subcategoria: categoriaDtoSchema.nullish(),
  imagenUrl: z.string().nullish(),
  imagenUrlFallback: z.string().nullish(),
  imagenes: z.array(imagenProductoDtoSchema).nullish(),
  // Ausente = no es empleado; `null` = empleado sin precio en la lista. Las
  // dos cosas son distintas en la UI, así que NO se usa `nullish` hacia el
  // dominio: el mapper conserva la diferencia.
  precioEmpleado: precioEmpleadoDtoSchema.nullable().optional(),
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

/** `GET /categories` → árbol completo, sin meta. */
export const categoriasDtoSchema = z.array(categoriaArbolDtoSchema)

/** Error estándar de NestJS. */
export const apiErrorDtoSchema = z.object({
  statusCode: z.number(),
  message: z.union([z.string(), z.array(z.string())]),
  error: z.string().optional(),
})

export type ProductoDto = z.infer<typeof productoDtoSchema>
export type ProveedorDto = z.infer<typeof proveedorDtoSchema>
export type MarcaDto = z.infer<typeof marcaDtoSchema>
export type CategoriaArbolDto = z.infer<typeof categoriaArbolDtoSchema>

/* ——— Mappers DTO → dominio ——— */

export function aCategoria(dto: CategoriaArbolDto): Categoria {
  return {
    id: dto.id,
    slug: dto.slug,
    nombre: dto.nombre,
    totalProductos: dto.totalProductos,
    subcategorias: dto.subcategorias,
  }
}

function aCategoriaProducto(
  dto: z.infer<typeof categoriaDtoSchema>
): CategoriaProducto {
  return { id: dto.id, nombre: dto.nombre, slug: dto.slug ?? null }
}

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
    slug: dto.slug || null,
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

/**
 * Etiqueta de respaldo, solo para un API que aún no manda `ivaEtiqueta`.
 * Mismo texto que el API. `=== null` y no `!ivaPct`: el 0 es «Sin IVA» y el
 * null «IVA por confirmar», y confundirlos afirma algo falso sobre la tarifa.
 */
function etiquetaIva(ivaPct: number | null): string {
  if (ivaPct === null) return "IVA por confirmar"
  if (ivaPct === 0) return "Sin IVA"
  return `IVA ${ivaPct} %`
}

function aPrecioEmpleado(
  dto: z.infer<typeof precioEmpleadoDtoSchema>
): PrecioEmpleado | null {
  // Formatear otra moneda como COP sería un precio falso: mejor ninguno.
  if (dto.moneda !== "COP") return null
  return {
    // Pesos → centavos: convención del proyecto (`src/lib/format.ts`).
    valor: Math.round(dto.precio * 100),
    valorConIva: Math.round(dto.precioConIva * 100),
    ivaPct: dto.ivaPct,
    ivaEtiqueta: dto.ivaEtiqueta?.trim() || etiquetaIva(dto.ivaPct),
    moneda: "COP",
    unidad: dto.unidad?.trim() || null,
    fechaFoto: dto.fechaFoto,
  }
}

export function aProducto(dto: ProductoDto): Producto {
  return {
    ...(dto.precioEmpleado !== undefined && {
      precioEmpleado: dto.precioEmpleado
        ? aPrecioEmpleado(dto.precioEmpleado)
        : null,
    }),
    id: dto.id,
    sku: dto.sku,
    nombre: dto.nombre,
    referencia: dto.descripcion ?? "",
    descripcionLarga: dto.descripcionLarga?.trim() || null,
    seo: {
      title: dto.seo?.title?.trim() || null,
      description: dto.seo?.description?.trim() || null,
    },
    marca: dto.marca ?? "",
    marcaId: dto.marcaId ?? null,
    fabricante: dto.fabricante ?? "",
    proveedor: aProveedor(dto.proveedor),
    categoria: dto.categoria ? aCategoriaProducto(dto.categoria) : null,
    subcategoria: dto.subcategoria
      ? aCategoriaProducto(dto.subcategoria)
      : null,
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
