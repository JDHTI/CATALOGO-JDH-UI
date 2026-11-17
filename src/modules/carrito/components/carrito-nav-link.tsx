"use client"

import { ShoppingCart } from "lucide-react"

import { IconNavLink } from "@/components/layout/icon-nav-link"

import { useCarrito, useEsEmpleado } from "../hooks/use-carrito"

/**
 * Ícono del carrito en el header, con `resumen.unidades` como contador.
 *
 * A diferencia de Favoritos, NO se pinta para anónimos ni clientes: el
 * carrito es solo de personal JDH y quien no lo tiene no debe ver un ícono
 * que lleva a un 404.
 */
export function CarritoNavLink() {
  const empleado = useEsEmpleado()
  const { data } = useCarrito()
  if (!empleado) return null

  return (
    <IconNavLink
      href="/carrito"
      icon={ShoppingCart}
      label="Carrito de compras"
      count={data?.resumen.unidades ?? 0}
    />
  )
}
