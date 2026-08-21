/**
 * Tipos de dominio del homepage. Los datos reales vendrán del ERP/CMS; por
 * ahora viven en `mock/inicio.mock.ts` con estas mismas formas, de modo que
 * conectar el backend sea sustituir el origen, no la estructura.
 */

/** Badge opcional sobre un producto destacado ("Nuevo", "Oferta"…). */
export type ProductoBadge = "Nuevo" | "Oferta" | "Más vendido"

export interface ProductoDestacado {
  id: string
  nombre: string
  /** Nombre de la categoría a la que pertenece (para mostrar, no para filtrar). */
  categoria: string
  /** Slug de la categoría — para la foto del modal en el listado. */
  categoriaSlug: string
  marca: string
  /** Precio de lista pública en CENTAVOS de COP (ver `src/lib/precios/types.ts`). */
  precioCentavos: number
  /** Unidad de venta tal como se compra: "Caja × 12", "Bulto 25 kg"… */
  unidadVenta: string
  /** Presentación para el modal: "Caja", "Bulto"… */
  presentacion: string
  /** Ruta de la foto del producto (public/photos/productos/…). */
  imagen: string
  descripcionCorta: string
  descripcionLarga: string
  detallesEmpaque: string[]
  badge?: ProductoBadge
}

export interface CategoriaDestacada {
  /** Slug usado en el link `/productos?categoria=<slug>`. */
  slug: string
  nombre: string
  /** Descripción breve — mostrada bajo el nombre en la grilla de categorías. */
  descripcion: string
  /**
   * Nombre del icono lucide a renderizar. Se mapea a componente en la capa de
   * presentación para no cruzar funciones por la frontera server→client.
   */
  icono: CategoriaIconoId
}

/** Iconos permitidos para categorías (los que usa el mock). */
export type CategoriaIconoId =
  | "droplets"
  | "wheat"
  | "milk"
  | "meat"
  | "cup-soda"
  | "can"
  | "cookie"
  | "spray-can"
  | "apple"
  | "snowflake"

export interface Proveedor {
  id: string
  nombre: string
  /** Línea promocional corta — usada en el banner rotable de proveedores. */
  slogan: string
  descripcion: string
}

/** Marca institucional destacada — banner grande de solo marcas (con logo). */
export interface Marca {
  id: string
  nombre: string
  /** Ruta del logo de la marca (public/photos/marcas/…). */
  imagen: string
}
