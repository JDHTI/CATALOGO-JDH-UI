"use client"

import * as React from "react"
import Link from "next/link"
import type { Route } from "next"
import {
  ArrowRight,
  Minus,
  Plus,
  RefreshCw,
  RotateCcw,
  ShoppingCart,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"

import { EmptyState } from "@/components/common/empty-state"
import { JdhButton } from "@/components/common/jdh-button"
import { PageHeader } from "@/components/common/page-header"
import { formatCentavos, formatNombreComercial } from "@/lib/format"
import { cn } from "@/lib/utils"
import { OlvidasteAlgoSection } from "@/modules/catalogo"
import { ProductoImagen } from "@/modules/catalogo/components/producto-imagen"

import {
  useCarrito,
  useFijarCantidad,
  useQuitarDelCarrito,
  useVaciarCarrito,
} from "../hooks/use-carrito"
import { CANTIDAD_MAXIMA } from "../limites"
import type { LineaCarrito } from "../types"
import { mensajeErrorCarrito } from "./agregar-al-carrito"

/**
 * Pantalla general del carrito del empleado. Precios ANTES de impuestos
 * (`precioUnitario`, `totalLinea`, `subtotal`): el IVA solo aparece al
 * finalizar, sin desglose por tarifa. Nunca se usa `precioConIva` aquí.
 *
 * Toda operación devuelve el carrito completo y se pinta tal cual: no hay
 * cálculo de totales en la UI.
 */
export function CarritoView() {
  const carrito = useCarrito()
  const vaciar = useVaciarCarrito()
  const [vaciarArmado, setVaciarArmado] = React.useState(false)

  const data = carrito.data
  const lineas = data?.lineas ?? []

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Carrito de compras"
        description="Precios de empleados JDH, antes de impuestos."
      >
        {lineas.length > 0 ? (
          vaciarArmado ? (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">¿Vaciar el carrito?</span>
              <JdhButton
                variant="destructive"
                size="sm"
                loading={vaciar.isPending}
                onClick={() =>
                  vaciar.mutate(undefined, {
                    onSuccess: () => setVaciarArmado(false),
                    onError: (error) => toast.error(mensajeErrorCarrito(error)),
                  })
                }
              >
                Vaciar
              </JdhButton>
              <JdhButton
                variant="ghost"
                size="sm"
                onClick={() => setVaciarArmado(false)}
              >
                Cancelar
              </JdhButton>
            </div>
          ) : (
            <JdhButton
              variant="ghost"
              size="sm"
              onClick={() => setVaciarArmado(true)}
            >
              <Trash2 aria-hidden="true" />
              Vaciar carrito
            </JdhButton>
          )
        ) : null}
      </PageHeader>

      {carrito.isError ? (
        <EmptyState
          icon={ShoppingCart}
          title="No pudimos cargar tu carrito"
          description="Verifica tu conexión e inténtalo de nuevo. Tus productos no se han modificado."
        >
          <JdhButton
            variant="secondary"
            size="sm"
            onClick={() => carrito.refetch()}
          >
            <RotateCcw aria-hidden="true" />
            Reintentar
          </JdhButton>
        </EmptyState>
      ) : carrito.isPending ? (
        <CarritoSkeleton />
      ) : lineas.length === 0 ? (
        <EmptyState
          icon={ShoppingCart}
          title="Tu carrito está vacío"
          description="Agrega productos desde el catálogo o compra una de tus listas."
        >
          <JdhButton asChild size="sm">
            <Link href="/productos">Explorar productos</Link>
          </JdhButton>
        </EmptyState>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
          <section aria-label="Productos en el carrito">
            <ul className="divide-y divide-[var(--color-border)] rounded-[var(--jdh-radius-md)] border border-[var(--color-border)]">
              {lineas.map((linea) => (
                <LineaItem key={linea.productoId} linea={linea} />
              ))}
            </ul>
          </section>

          <ResumenCarritoPanel
            unidades={data!.resumen.unidades}
            lineas={data!.resumen.lineas}
            subtotal={data!.resumen.subtotal}
            noDisponibles={data!.resumen.lineasNoDisponibles}
          />
        </div>
      )}

      {lineas.length > 0 ? (
        <OlvidasteAlgoSection
          productos={lineas.map((linea) => linea.producto)}
          className="border-t border-[var(--color-border)] pt-6"
        />
      ) : null}
    </div>
  )
}

function ResumenCarritoPanel({
  unidades,
  lineas,
  subtotal,
  noDisponibles,
}: {
  unidades: number
  lineas: number
  subtotal: number
  noDisponibles: number
}) {
  const bloqueado = noDisponibles > 0
  return (
    <aside
      aria-labelledby="resumen-carrito"
      className="flex flex-col gap-4 rounded-[var(--jdh-radius-md)] border border-[var(--color-border-strong)] p-5 lg:sticky lg:top-[calc(var(--catalogo-chrome-height)+1rem)]"
    >
      <h2 id="resumen-carrito" className="text-base font-semibold">
        Resumen
      </h2>
      <dl className="flex flex-col gap-2 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Productos</dt>
          <dd className="tabular-nums">{lineas}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Unidades</dt>
          <dd className="tabular-nums">{unidades}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-4 border-t border-[var(--color-border)] pt-3">
          <dt className="font-medium">Subtotal</dt>
          <dd className="text-xl font-bold tabular-nums">
            {formatCentavos(subtotal)}
          </dd>
        </div>
      </dl>
      <p className="text-xs text-muted-foreground">
        Precios antes de impuestos. Los impuestos se calculan al finalizar el
        pedido.
      </p>
      {bloqueado ? (
        <p id="carrito-bloqueado" role="status" className="text-sm font-medium">
          Quita {noDisponibles === 1 ? "el producto" : "los productos"} que ya
          no {noDisponibles === 1 ? "está disponible" : "están disponibles"}{" "}
          para finalizar el pedido.
        </p>
      ) : null}
      {bloqueado ? (
        <JdhButton disabled aria-describedby="carrito-bloqueado">
          Finalizar pedido
          <ArrowRight aria-hidden="true" />
        </JdhButton>
      ) : (
        <JdhButton asChild>
          <Link href={"/carrito/finalizar" as Route}>
            Finalizar pedido
            <ArrowRight aria-hidden="true" />
          </Link>
        </JdhButton>
      )}
    </aside>
  )
}

function LineaItem({ linea }: { linea: LineaCarrito }) {
  const fijar = useFijarCantidad()
  const quitar = useQuitarDelCarrito()
  const [borrador, setBorrador] = React.useState<string | null>(null)
  const ocupada = fijar.isPending || quitar.isPending
  const { producto } = linea
  const href = `/productos/${encodeURIComponent(producto.id)}` as Route

  const fijarCantidad = (cantidad: number) => {
    if (
      !Number.isInteger(cantidad) ||
      cantidad < 1 ||
      cantidad > CANTIDAD_MAXIMA ||
      cantidad === linea.cantidad
    ) {
      setBorrador(null)
      return
    }
    fijar.mutate(
      { productoId: linea.productoId, cantidad },
      {
        onSettled: () => setBorrador(null),
        onError: (error) => toast.error(mensajeErrorCarrito(error)),
      }
    )
  }

  return (
    <li
      className={cn(
        "grid grid-cols-[4.5rem_minmax(0,1fr)] gap-x-4 gap-y-3 p-4 sm:grid-cols-[5rem_minmax(0,1fr)_auto]",
        !linea.disponible && "bg-[var(--color-surface-subtle)]"
      )}
    >
      <Link
        href={href}
        tabIndex={-1}
        aria-hidden="true"
        className={cn(
          "row-span-2 overflow-hidden rounded-[var(--jdh-radius-sm)] border border-[var(--color-border)] sm:row-span-1",
          !linea.disponible && "opacity-50"
        )}
      >
        <ProductoImagen
          producto={producto}
          variant="miniatura"
          sizes="80px"
          className="aspect-square w-full"
        />
      </Link>

      <div className={cn("min-w-0", !linea.disponible && "opacity-60")}>
        {producto.marca ? (
          <p className="truncate text-xs font-medium tracking-wide text-muted-foreground">
            {formatNombreComercial(producto.marca)}
          </p>
        ) : null}
        <Link
          href={href}
          className="line-clamp-2 text-sm font-medium hover:underline focus-visible:underline focus-visible:outline-none"
        >
          {producto.nombre}
        </Link>
        <p className="text-xs text-muted-foreground tabular-nums">
          SKU {producto.sku}
        </p>
        {linea.disponible && linea.precioUnitario !== null ? (
          <p className="mt-1 text-xs text-muted-foreground tabular-nums">
            {formatCentavos(linea.precioUnitario)} c/u
          </p>
        ) : null}
        {linea.precioCambio ? (
          <p className="mt-1 flex items-center gap-1 text-xs font-medium">
            <RefreshCw className="size-3" aria-hidden="true" />
            El precio se actualizó
          </p>
        ) : null}
        {!linea.disponible ? (
          <p className="mt-1 text-xs font-medium">Ya no disponible</p>
        ) : null}
      </div>

      <div className="col-start-2 flex flex-wrap items-center justify-between gap-3 sm:col-start-3 sm:row-start-1 sm:flex-col sm:items-end sm:justify-start">
        {linea.disponible ? (
          <div
            role="group"
            aria-label={`Cantidad de ${producto.nombre}`}
            className="flex items-center rounded-lg border border-[var(--color-border-strong)]"
          >
            <button
              type="button"
              aria-label="Quitar una unidad"
              disabled={ocupada || linea.cantidad <= 1}
              onClick={() => fijarCantidad(linea.cantidad - 1)}
              className="flex size-9 items-center justify-center rounded-l-lg hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:opacity-40"
            >
              <Minus className="size-4" aria-hidden="true" />
            </button>
            <input
              type="number"
              inputMode="numeric"
              min={1}
              max={CANTIDAD_MAXIMA}
              aria-label="Cantidad"
              disabled={ocupada}
              value={borrador ?? String(linea.cantidad)}
              onChange={(event) => setBorrador(event.target.value)}
              onBlur={() =>
                borrador !== null ? fijarCantidad(Number(borrador)) : undefined
              }
              onKeyDown={(event) => {
                if (event.key === "Enter") event.currentTarget.blur()
                if (event.key === "Escape") setBorrador(null)
              }}
              className="h-9 w-14 [appearance:textfield] border-x border-[var(--color-border)] bg-background text-center text-sm tabular-nums focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <button
              type="button"
              aria-label="Agregar una unidad"
              disabled={ocupada || linea.cantidad >= CANTIDAD_MAXIMA}
              onClick={() => fijarCantidad(linea.cantidad + 1)}
              className="flex size-9 items-center justify-center rounded-r-lg hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:opacity-40"
            >
              <Plus className="size-4" aria-hidden="true" />
            </button>
          </div>
        ) : null}

        <div className="flex items-center gap-2">
          {linea.totalLinea !== null ? (
            <p className="text-sm font-semibold tabular-nums">
              {formatCentavos(linea.totalLinea)}
            </p>
          ) : null}
          <JdhButton
            variant="ghost"
            size={linea.disponible ? "icon-sm" : "sm"}
            loading={quitar.isPending}
            aria-label={`Quitar ${producto.nombre} del carrito`}
            title="Quitar del carrito"
            onClick={() =>
              quitar.mutate(linea.productoId, {
                onError: (error) => toast.error(mensajeErrorCarrito(error)),
              })
            }
          >
            {quitar.isPending ? null : <Trash2 aria-hidden="true" />}
            {linea.disponible ? null : "Quitar"}
          </JdhButton>
        </div>
      </div>
    </li>
  )
}

function CarritoSkeleton() {
  return (
    <div
      role="status"
      aria-label="Cargando carrito"
      className="grid animate-pulse gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]"
    >
      <span className="sr-only">Cargando carrito…</span>
      <div className="flex flex-col gap-px overflow-hidden rounded-[var(--jdh-radius-md)] border border-[var(--color-border)]">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="flex gap-4 p-4">
            <div className="size-20 rounded bg-[var(--color-surface-subtle)]" />
            <div className="flex flex-1 flex-col gap-2">
              <div className="h-3 w-24 rounded bg-[var(--color-surface-subtle)]" />
              <div className="h-4 w-3/4 rounded bg-[var(--color-surface-subtle)]" />
              <div className="h-3 w-20 rounded bg-[var(--color-surface-subtle)]" />
            </div>
          </div>
        ))}
      </div>
      <div className="h-56 rounded-[var(--jdh-radius-md)] bg-[var(--color-surface-subtle)]" />
    </div>
  )
}
