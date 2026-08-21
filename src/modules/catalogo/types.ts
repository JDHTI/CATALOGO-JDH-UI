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
