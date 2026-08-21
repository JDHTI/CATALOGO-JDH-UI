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
  /** Precio de lista pública en CENTAVOS de COP (ver `src/lib/precios/types.ts`). */
  precioCentavos: number
  /** Unidad de venta tal como se compra: "Caja × 12", "Bulto 25 kg"… */
  unidadVenta: string
  badge?: ProductoBadge
}

export interface CategoriaDestacada {
  /** Slug usado en el link `/productos?categoria=<slug>`. */
  slug: string
  nombre: string
  descripcion: string
  /**
   * Nombre del icono lucide a renderizar. Se mapea a componente en la capa de
   * presentación para no cruzar funciones por la frontera server→client.
   */
  icono: CategoriaIconoId
}

/** Iconos permitidos para categorías (los que usa el mock). */
export type CategoriaIconoId =
  "droplets" | "wheat" | "milk" | "cup-soda" | "spray-can" | "cookie"

export interface Proveedor {
  id: string
  nombre: string
  descripcion: string
}
