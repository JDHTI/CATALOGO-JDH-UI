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
  /**
   * Logo del proveedor en el bucket. Campo ACORDADO pero todavía no
   * publicado por el backend: mientras llegue `null`/ausente, la UI pinta el
   * monograma de `LogoComercial`. Cuando el backend empiece a enviarlo, la
   * imagen aparece sola — no hay que tocar componentes.
   */
  logoUrl?: string | null
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
  /** Logo de la marca en el bucket — mismo trato que `Proveedor.logoUrl`. */
  logoUrl?: string | null
}

/** Categoría / subcategoría (existen en el esquema, aún sin datos). */
export interface CategoriaProducto {
  id: string
  nombre: string
}

/** Una imagen de la galería del producto, en sus 3 variantes WebP. */
export interface ImagenProducto {
  thumbUrl: string
  cardUrl: string
  fullUrl: string
  alt: string | null
  position: number
  esPrincipal: boolean
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
  /**
   * URL de la variante `card` de la imagen primaria — null mientras el
   * producto no tenga foto. Se mantiene por compatibilidad; `ProductoImagen`
   * prefiere `imagenes` cuando está disponible (permite pedir `thumb`/`full`
   * según el tamaño del recuadro).
   */
  imagenUrl: string | null
  /** Galería completa, primaria primero. Vacío si el producto no tiene fotos. */
  imagenes: ImagenProducto[]
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
