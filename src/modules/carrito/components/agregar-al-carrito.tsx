"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ShoppingCart } from "lucide-react"
import { toast } from "sonner"

import { JdhButton } from "@/components/common/jdh-button"
import { cn } from "@/lib/utils"
import type { Producto } from "@/modules/catalogo"

import { CarritoApiError } from "../api/client"
import { useAgregarAlCarrito } from "../hooks/use-carrito"
import { CANTIDAD_MAXIMA, LINEAS_MAXIMAS } from "../limites"

/**
 * Se puede comprar si el producto trae precio de EMPLEADO. El dato ya decide
 * la audiencia: `precioEmpleado` solo existe para personal JDH, así que para
 * anónimos y clientes esto es `false` sin leer la sesión, y con `null`
 * (fuera de la lista) el API respondería 422.
 */
export function sePuedeComprar(producto: Pick<Producto, "precioEmpleado">) {
  return producto.precioEmpleado != null
}

/** Texto para el usuario a partir del error del API (`docs/carrito-pedidos.md`). */
export function mensajeErrorCarrito(error: unknown): string {
  if (!(error instanceof CarritoApiError)) {
    return "No pudimos actualizar el carrito. Inténtalo de nuevo."
  }
  switch (error.statusCode) {
    case 401:
      return "Tu sesión terminó. Vuelve a iniciar sesión."
    case 403:
      return "El carrito es solo para personal JDH."
    case 404:
      return "Este producto ya no está disponible."
    case 422:
      return "Este producto no tiene precio de empleado y no se puede pedir."
    case 409:
      return error.code === "LIMITE_LINEAS"
        ? `El carrito admite máximo ${LINEAS_MAXIMAS} productos distintos.`
        : error.message
    // 400 (más de 9.999 unidades) trae un mensaje del API pensado para
    // mostrarse.
    default:
      return error.message
  }
}

function useAgregar(producto: Producto) {
  const router = useRouter()
  const agregar = useAgregarAlCarrito()

  const ejecutar = (cantidad: number, alTerminar?: () => void) =>
    agregar.mutate(
      { productoId: producto.id, cantidad },
      {
        onSuccess: () => {
          toast.success("Agregado al carrito", {
            description:
              cantidad > 1
                ? `${cantidad} × ${producto.nombre}`
                : producto.nombre,
            action: {
              label: "Ver carrito",
              onClick: () => router.push("/carrito"),
            },
          })
          alTerminar?.()
        },
        onError: (error) => toast.error(mensajeErrorCarrito(error)),
      }
    )

  return { ejecutar, pendiente: agregar.isPending }
}

/**
 * Botón de la CARD: solo ícono, encima de la card como el corazón (fuera del
 * `<a>`: un botón dentro de un enlace es HTML inválido). Agrega 1 unidad.
 *
 * La decisión va ANTES de cualquier hook: para anónimos y clientes (la
 * mayoría de las cards) no se monta ni el router ni una mutación por card.
 */
export function AgregarAlCarritoIcono(props: {
  producto: Producto
  className?: string
}) {
  return sePuedeComprar(props.producto) ? <IconoAgregar {...props} /> : null
}

function IconoAgregar({
  producto,
  className,
}: {
  producto: Producto
  className?: string
}) {
  const { ejecutar, pendiente } = useAgregar(producto)
  const etiqueta = `Agregar ${producto.nombre} al carrito`
  return (
    <JdhButton
      type="button"
      variant="secondary"
      size="icon-sm"
      loading={pendiente}
      aria-label={etiqueta}
      title={etiqueta}
      onClick={() => ejecutar(1)}
      className={cn("bg-background", className)}
    >
      {pendiente ? null : <ShoppingCart aria-hidden="true" />}
    </JdhButton>
  )
}

/** FICHA: selector de cantidad + «Agregar al carrito». */
export function AgregarAlCarritoFicha({ producto }: { producto: Producto }) {
  return sePuedeComprar(producto) ? <FichaAgregar producto={producto} /> : null
}

function FichaAgregar({ producto }: { producto: Producto }) {
  const { ejecutar, pendiente } = useAgregar(producto)
  const [borrador, setBorrador] = React.useState("1")
  const id = React.useId()
  const cantidad = Number(borrador)
  const valida =
    Number.isInteger(cantidad) && cantidad >= 1 && cantidad <= CANTIDAD_MAXIMA

  return (
    <form
      className="flex items-end gap-2"
      onSubmit={(event) => {
        event.preventDefault()
        if (valida && !pendiente) ejecutar(cantidad, () => setBorrador("1"))
      }}
    >
      <label htmlFor={id} className="flex flex-col gap-1 text-sm font-medium">
        Cantidad
        <input
          id={id}
          type="number"
          inputMode="numeric"
          min={1}
          max={CANTIDAD_MAXIMA}
          step={1}
          value={borrador}
          onChange={(event) => setBorrador(event.target.value)}
          aria-invalid={!valida || undefined}
          className="h-10 w-20 rounded-lg border border-[var(--color-border-strong)] bg-background px-3 text-foreground tabular-nums aria-invalid:border-2 aria-invalid:border-foreground"
        />
      </label>
      <JdhButton
        type="submit"
        className="min-w-0 px-4"
        loading={pendiente}
        disabled={!valida}
      >
        {pendiente ? null : <ShoppingCart aria-hidden="true" />}
        Agregar al carrito
      </JdhButton>
    </form>
  )
}
