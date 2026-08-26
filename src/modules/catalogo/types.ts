/**
 * Contrato con jdh-catalogo-api (backend NestJS) — productos REALES.
 *
 * Estos tipos son el DOMINIO de la UI, no el DTO del API: la forma del
 * API se valida en `schemas/api.ts` y se traduce aquí vía mappers, de
 * modo que un rename de campos en el backend se absorbe en un solo
 * lugar. El catálogo es solo referencia visual (sin venta): NO hay
 * precio en estos tipos — cuando el backend defina precios se añadirá
 * el campo aquí y en el mapper, nunca improvisado en componentes.
 */

/** Proveedor tal como viaja embebido en un producto y en `GET /suppliers`. */
export interface Proveedor {
  id: string
  nombre: string
  /** Solo en `GET /suppliers` (no embebido en producto) — conteo de
   *  productos activos del proveedor. `/suppliers` no acepta parámetros,
   *  así que este conteo no se acota por nada. */
  totalProductos?: number
}

/**
 * Marca de `GET /brands` — tabla propia en el backend, así que el filtro va
 * por `id`. Ojo: dentro de un `Producto`, `marca` es el NOMBRE en texto
 * plano (no este objeto); los dos ejes de clasificación del catálogo son
 * proveedor y marca.
 */
export interface Marca {
  id: string
  nombre: string
  /**
   * Conteo de productos activos, para el panel de filtros. SE ACOTA al
   * `supplierId` de la consulta: pidiendo `/brands?supplierId=5`, el número
   * es de productos de esa marca EN ESE PROVEEDOR, no global (verificado en
   * el backend, que usa el mismo filtro para la lista y para el conteo). Por
   * eso puede mostrarse junto a la marca sin condicionarlo: el número y la
   * lista siempre dicen lo mismo.
   */
  totalProductos?: number
}

/** Categoría / subcategoría (existen en el esquema, aún sin datos). */
export interface CategoriaProducto {
  id: string
  nombre: string
}

/** Producto real del catálogo (listado y detalle comparten forma). */
export interface Producto {
  id: string
  sku: string
  nombre: string
  descripcion: string
  marca: string
  fabricante: string
  proveedor: Proveedor
  categoria: CategoriaProducto | null
  subcategoria: CategoriaProducto | null
  /** URL del bucket S3 — null mientras el producto no tenga foto. */
  imagenUrl: string | null
}

/** Meta de paginación estándar de los listados del API. */
export interface PaginacionMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

/** Página de resultados: `{ data, meta }` en todos los listados. */
export interface Paginado<T> {
  data: T[]
  meta: PaginacionMeta
}

/** Parámetros que acepta `GET /products` (la UI solo los transporta;
 *  la semántica de `search` — nombre, sku y marca — la decide el backend).
 *  `page`/`limit` son opcionales: sin ellos el backend devuelve su primera
 *  página por defecto. */
export interface ProductosQueryParams {
  page?: number
  limit?: number
  search?: string
  supplierId?: string
  /** Filtro por marca — va por id, no por nombre. */
  brandId?: string
}

/** Parámetros de `GET /brands`: acota las marcas a un proveedor. */
export interface MarcasQueryParams {
  supplierId?: string
}
