import type { Precio } from "@/lib/precios/types"

import { siteConfig } from "@/config/site"

/**
 * Formateo de moneda. Los valores viajan en CENTAVOS de COP en todo el
 * proyecto (ver `Precio.valor`) para no arrastrar errores de punto flotante en
 * sumas de pedidos; la conversión a unidades ocurre solo aquí, al mostrar.
 *
 * `maximumFractionDigits: 0` porque en COP los centavos no se muestran nunca.
 */
const currencyFormatter = new Intl.NumberFormat(siteConfig.locale, {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
})

export function formatCentavos(centavos: number): string {
  return currencyFormatter.format(centavos / 100)
}

export function formatPrecio(precio: Precio): string {
  return formatCentavos(precio.valor)
}

const numberFormatter = new Intl.NumberFormat(siteConfig.locale)

export function formatNumero(value: number): string {
  return numberFormatter.format(value)
}
