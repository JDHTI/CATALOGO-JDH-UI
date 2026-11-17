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

const MESES_CORTOS = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
]

/**
 * Fecha de calendario `YYYY-MM-DD` → "17 nov 2026". A mano y no con
 * `Intl.DateTimeFormat`: `new Date("2026-11-17")` es medianoche UTC, que en
 * Colombia (UTC−5) se pinta como el día ANTERIOR, y `es-CO` además produce
 * "17 de nov. de 2026". Si el texto no tiene esa forma se devuelve tal cual.
 */
export function formatFechaCorta(fecha: string): string {
  const partes = /^(\d{4})-(\d{2})-(\d{2})$/.exec(fecha)
  const mes = partes ? MESES_CORTOS[Number(partes[2]) - 1] : undefined
  if (!partes || !mes) return fecha
  return `${Number(partes[3])} ${mes} ${partes[1]}`
}

const numberFormatter = new Intl.NumberFormat(siteConfig.locale)

export function formatNumero(value: number): string {
  return numberFormatter.format(value)
}

/**
 * Siglas y formas jurídicas que se quedan en mayúsculas al presentar un
 * nombre comercial. Se comparan sin puntos ("S.A." y "SA" son la misma).
 */
const SIGLAS = new Set([
  "SA",
  "SAS",
  "SAA",
  "LTDA",
  "EU",
  "CIA",
  "INC",
  "BV",
  "CI",
])

/** Partículas que van en minúscula salvo al inicio del nombre. */
const PARTICULAS = new Set(["de", "del", "la", "las", "los", "y", "e", "en"])

/**
 * Presenta un nombre comercial (proveedor, marca, fabricante) que llega del
 * ERP EN MAYÚSCULAS SOSTENIDAS y con forma jurídica: "LOCERIA COLOMBIANA
 * S.A." → "Loceria Colombiana S.A.". El backend guarda el texto crudo del
 * datawarehouse a propósito (solo `trim`), así que la normalización es
 * responsabilidad de la capa de presentación.
 *
 * Es SOLO para mostrar: el valor crudo se conserva en el dominio, porque es
 * lo que se compara contra los assets de logos y lo que el backend espera en
 * una búsqueda. Y solo interviene si el texto viene mayormente en
 * mayúsculas — un nombre ya bien escrito ("Alpina") se devuelve intacto, sin
 * arriesgar a estropear una capitalización deliberada ("iSelect", "3M").
 *
 * No corrige tildes ausentes: el origen no las trae ("LOCERIA") y añadirlas
 * exigiría un diccionario que inventaría nombres.
 */
export function formatNombreComercial(nombre: string): string {
  const texto = nombre.trim()
  if (!texto) return texto

  const letras = texto.replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/g, "")
  if (!letras) return texto
  // Mayúsculas sostenidas = casi todas las letras en alta. Con menos, se
  // asume capitalización intencional y no se toca.
  const enAlta = letras.replace(/[^A-ZÁÉÍÓÚÜÑ]/g, "").length / letras.length
  if (enAlta < 0.8) return texto

  return texto
    .toLowerCase()
    .split(/(\s+)/)
    .map((token, indice) => {
      if (/^\s+$/.test(token)) return token
      const desnudo = token.replace(/[.\-,]/g, "").toUpperCase()
      if (SIGLAS.has(desnudo)) return token.toUpperCase()
      if (indice > 0 && PARTICULAS.has(token)) return token
      // Capitaliza la primera LETRA del token —,no la primera posición— para
      // no estropear nombres que empiezan por dígito ("3M", no "3m"), y
      // también la que sigue a un guion interno ("COCA-COLA" → "Coca-Cola").
      return token.replace(
        /(^[^\p{L}]*|[-/])(\p{Ll})/gu,
        (_, separador: string, letra: string) => separador + letra.toUpperCase()
      )
    })
    .join("")
}
