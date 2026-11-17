/**
 * Contrato de precios. Vive aparte de `index.ts` (que es `server-only`) para
 * que los tipos puedan importarse desde componentes cliente.
 */

/**
 * Quién está mirando el catálogo. Determina de dónde sale el precio, NO cómo
 * se ve la página: la estructura del catálogo público y la del catálogo de
 * clientes es la misma (misma ruta, mismo shell, mismos componentes).
 */
export type Audiencia = "publico" | "cliente" | "empleado"

/**
 * Contexto resuelto una sola vez por request en el servidor y bajado a la
 * capa de datos de cada módulo. `listaPrecioId` es el identificador de la
 * lista negociada en el ERP; `null` significa "lista pública".
 */
export interface PriceContext {
  audiencia: Audiencia
  /** Código del cliente en el ERP (SIESA). `null` para el frente público. */
  clienteId: string | null
  /** Lista de precios asignada al cliente. `null` → lista pública. */
  listaPrecioId: string | null
  /** El cliente puede ver precios con IVA incluido o sin él (preferencia). */
  mostrarIva: boolean
}

/** Precio ya resuelto para una audiencia concreta, listo para formatear. */
export interface Precio {
  /** Valor en centavos de COP, para no arrastrar errores de punto flotante. */
  valor: number
  moneda: "COP"
  /** Etiqueta de la lista aplicada, para mostrar procedencia al cliente. */
  lista: string
  /** Precio de lista pública, cuando el del cliente es menor (para tachado). */
  valorAnterior?: number
}
