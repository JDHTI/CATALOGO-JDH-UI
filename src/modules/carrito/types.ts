import type { Producto } from "@/modules/catalogo"

/**
 * Dominio del carrito y los pedidos de EMPLEADOS JDH. Todos los importes en
 * CENTAVOS de COP (convención del proyecto); el API manda pesos enteros y el
 * mapper de `schemas/api.ts` convierte en la frontera.
 *
 * El carrito se muestra SIN impuestos. Subtotal, impuestos y total (sin
 * desglose por tarifa) solo aparecen al finalizar el pedido.
 */

export interface LineaCarrito {
  productoId: string
  cantidad: number
  producto: Producto
  /** false: inactivo o salió de la lista → no suma y bloquea el envío. */
  disponible: boolean
  /** Sin IVA. null si no está disponible. */
  precioUnitario: number | null
  /** Sin IVA. null si no está disponible. */
  totalLinea: number | null
  /** La lista se recargó y cambió el precio o el IVA desde que se agregó. */
  precioCambio: boolean
}

export interface ResumenCarrito {
  lineas: number
  unidades: number
  /** Sin IVA. */
  subtotal: number
  lineasNoDisponibles: number
}

export interface Carrito {
  lineas: LineaCarrito[]
  resumen: ResumenCarrito
}

export type MotivoOmitido = "inactivo" | "sin_precio" | "limite"

export interface ResultadoCompraLista {
  carrito: Carrito
  agregados: number
  omitidos: { productoId: string; nombre: string; motivo: MotivoOmitido }[]
}

export interface Solicitante {
  nombre: string
  email: string
}

/** Línea congelada para finalizar el pedido o ya en el pedido. */
export interface LineaPedido {
  productoId: string
  sku: string
  nombre: string
  cantidad: number
  precioUnitario: number
  totalLinea: number
}

export interface ResumenFinalizar {
  lineas: LineaPedido[]
  subtotal: number
  /** Un solo valor, sin desglose por tarifa. */
  impuestos: number
  total: number
  /** Hay productos con IVA por confirmar: su IVA no está en `impuestos`. */
  ivaPorConfirmar: boolean
  fechaFoto: string | null
  solicitante: Solicitante
  /** productIds no disponibles: si hay alguno, se vuelve al carrito. */
  noDisponibles: string[]
}

export type EstadoCorreo = "pendiente" | "enviado" | "error" | "deshabilitado"

export interface Pedido {
  id: string
  /** "PED-000123". */
  numero: string
  /** ISO 8601. */
  fecha: string
  solicitante: Solicitante
  nota: string | null
  lineas: LineaPedido[]
  subtotal: number
  impuestos: number
  total: number
  ivaPorConfirmar: boolean
  fechaFoto: string | null
  correo: EstadoCorreo
}
