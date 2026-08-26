/**
 * Tipos de dominio del catálogo (listado de /productos). Los datos reales
 * vendrán del ERP/CMS; por ahora viven en `mock/catalogo.mock.ts` con estas
 * mismas formas, de modo que conectar el backend sea sustituir el origen, no
 * la estructura.
 */

/** Badge comercial opcional de un producto. */
export type ProductoBadge = "Nuevo" | "Oferta" | "Más vendido"

export interface ProductoCatalogo {
  id: string
  nombre: string
  /** Slug de la categoría (coincide con searchCategoryOptions). */
  categoriaSlug: string
  /** Nombre visible de la categoría. */
  categoria: string
  marca: string
  /** Precio de lista pública en CENTAVOS de COP. */
  precioCentavos: number
  /** Precio anterior (para tachado en ofertas). */
  precioAnteriorCentavos?: number
  /** Unidad de venta: "Caja × 12 botellas de 1 L". */
  unidadVenta: string
  /** Presentación para el filtro: "Caja", "Bulto", "Caneca", "Paquete"… */
  presentacion: string
  /** Descripción breve — línea de apoyo en la card. */
  descripcionCorta: string
  /** Descripción larga — cuerpo del modal de detalle. */
  descripcionLarga: string
  /** Detalles de empaque — lista del modal. */
  detallesEmpaque: string[]
  /** Foto opcional (el listado va sin imagen; el modal cae a la de categoría). */
  imagen?: string
  badge?: ProductoBadge
  disponible: boolean
}

/* ————————————————————————————————————————————————————————————————
 * Contrato con jdh-catalogo-api (backend NestJS) — productos REALES.
 *
 * Estos tipos son el DOMINIO de la UI, no el DTO del API: la forma del
 * API se valida en `schemas/api.ts` y se traduce aquí vía mappers, de
 * modo que un rename de campos en el backend se absorbe en un solo
 * lugar. El catálogo es solo referencia visual (sin venta): NO hay
 * precio en estos tipos — cuando el backend defina precios se añadirá
 * el campo aquí y en el mapper, nunca improvisado en componentes.
 * ———————————————————————————————————————————————————————————————— */

/** Proveedor tal como viaja embebido en un producto y en `GET /suppliers`. */
export interface Proveedor {
  id: string
  nombre: string
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
 *  la semántica de `search` — nombre, sku y marca — la decide el backend). */
export interface ProductosQueryParams {
  page?: number
  limit?: number
  search?: string
  supplierId?: string
}

/** Estado de los filtros rápidos del listado. */
export interface FiltrosCatalogo {
  categorias: string[]
  marcas: string[]
  /** Rango en COP (unidades, no centavos) — null = sin límite. */
  precioMin: number | null
  precioMax: number | null
  soloOfertas: boolean
  presentaciones: string[]
  soloDisponibles: boolean
}

export const filtrosIniciales: FiltrosCatalogo = {
  categorias: [],
  marcas: [],
  precioMin: null,
  precioMax: null,
  soloOfertas: false,
  presentaciones: [],
  soloDisponibles: false,
}

export type OrdenCatalogo =
  "relevancia" | "precio-asc" | "precio-desc" | "nombre"

export const ordenOpciones: { value: OrdenCatalogo; label: string }[] = [
  { value: "relevancia", label: "Relevancia" },
  { value: "precio-asc", label: "Menor precio" },
  { value: "precio-desc", label: "Mayor precio" },
  { value: "nombre", label: "Nombre A–Z" },
]
