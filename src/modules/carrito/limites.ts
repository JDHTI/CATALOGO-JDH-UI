/** Límites del carrito, los mismos que valida el API (`docs/carrito-pedidos.md`). */
export const CANTIDAD_MAXIMA = 9999
export const LINEAS_MAXIMAS = 200
export const NOTA_MAXIMA = 500

/**
 * Envío gratuito a domicilio desde $ 200.000 de pedido, en CENTAVOS. Se mide
 * contra el subtotal del carrito (antes de impuestos), el único total que el
 * carrito conoce. Hoy es solo un umbral de la UI: el API no lo valida.
 */
export const ENVIO_GRATIS_DESDE = 200_000 * 100
