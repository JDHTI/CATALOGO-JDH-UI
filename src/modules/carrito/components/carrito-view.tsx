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
import { Breadcrumbs } from "@/components/navigation/breadcrumbs"
import { formatCentavos, formatNombreComercial } from "@/lib/format"
import { cn } from "@/lib/utils"
import { OlvidasteAlgoSection } from "@/modules/catalogo"
import { ProductoImagen } from "@/modules/catalogo/components/producto-imagen"

import {
  useCarrito,
  useFijarCantidad,
  useQuitarDelCarrito,
} from "../hooks/use-carrito"
import { CANTIDAD_MAXIMA } from "../limites"
import type { LineaCarrito } from "../types"
import { mensajeErrorCarrito } from "./agregar-al-carrito"
import { EnvioGratisProgreso } from "./envio-gratis-progreso"

/**
 * Pantalla general del carrito del empleado. Precios ANTES de impuestos
 * (`precioUnitario`, `totalLinea`, `subtotal`): el IVA solo aparece al
 * finalizar, sin desglose por tarifa. Nunca se usa `precioConIva` aquí.
 *
 * Toda operación devuelve el carrito completo y se pinta tal cual: no hay
 * cálculo de totales en la UI.
 *
 * Desde `md` los productos y el resumen comparten fila: el panel de productos
 * a la izquierda y el resumen fijo (`sticky`) a la derecha. En un teléfono no
 * caben dos columnas y el resumen va debajo.
 */
export function CarritoView() {
  const carrito = useCarrito()
  const data = carrito.data
  const lineas = data?.lineas ?? []

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <Breadcrumbs
          items={[{ label: "Inicio", href: "/" }, { label: "Mi carrito" }]}
        />
        <header className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight uppercase sm:text-4xl">
            Mi carrito
          </h1>
          <p className="text-sm text-muted-foreground">
            Lista de precios de empleados
          </p>
        </header>
      </div>

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
        <div className={COLUMNAS}>
          <section
            aria-label="Productos en el carrito"
            className="@container min-w-0"
          >
            <ul className="divide-y divide-[var(--color-border)] rounded-[var(--jdh-radius-md)] border border-[var(--color-border)]">
              {lineas.map((linea) => (
                <LineaItem key={linea.productoId} linea={linea} />
              ))}
            </ul>
          </section>

          <div className="flex flex-col gap-3 md:sticky md:top-[calc(var(--catalogo-chrome-height)+1rem)]">
            <EnvioGratisProgreso subtotal={data!.resumen.subtotal} />
            <ResumenCarritoPanel
              unidades={data!.resumen.unidades}
              lineas={data!.resumen.lineas}
              subtotal={data!.resumen.subtotal}
              noDisponibles={data!.resumen.lineasNoDisponibles}
            />
          </div>
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

/** Productos a la izquierda, resumen a la derecha desde `md`. */
const COLUMNAS =
  "grid items-start gap-4 md:grid-cols-[minmax(0,1fr)_17rem] lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-6"

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
      className="flex flex-col gap-3 rounded-[var(--jdh-radius-md)] border border-[var(--color-border-strong)] p-4 lg:p-5"
    >
      <h2 id="resumen-carrito" className="text-base font-semibold">
        Resumen
      </h2>
      <dl className="flex flex-col gap-1.5 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Productos</dt>
          <dd className="tabular-nums">{lineas}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Unidades</dt>
          <dd className="tabular-nums">{unidades}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-4 border-t border-[var(--color-border)] pt-2.5">
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

/**
 * Una fila compacta del carrito. Se acomoda al ANCHO DEL PANEL (container
 * query), no al de la pantalla: el panel comparte fila con el resumen, así que
 * su ancho no sigue al viewport.
 *
 * - panel angosto: imagen | producto | quitar; debajo, cantidad | total.
 * - panel ancho (`@xl`): imagen | producto | cantidad | total | quitar, en una
 *   sola línea centrada en vertical.
 */
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
        "grid grid-cols-[4rem_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 p-3",
        "@xl:grid-cols-[4.5rem_minmax(0,1fr)_auto_7rem_auto] @xl:gap-x-4 @xl:px-4",
        !linea.disponible && "bg-[var(--color-surface-subtle)]"
      )}
    >
      <Link
        href={href}
        tabIndex={-1}
        aria-hidden="true"
        className={cn(
          "col-start-1 row-span-2 row-start-1 self-start overflow-hidden rounded-[var(--jdh-radius-sm)] border border-[var(--color-border)] bg-background @xl:row-span-1 @xl:self-center",
          !linea.disponible && "opacity-50"
        )}
      >
        <ProductoImagen
          producto={producto}
          variant="miniatura"
          sizes="72px"
          className="aspect-square w-full"
        />
      </Link>

      <div
        className={cn(
          "col-start-2 row-start-1 min-w-0",
          !linea.disponible && "opacity-60"
        )}
      >
        <Link
          href={href}
          className="line-clamp-2 text-sm leading-snug font-bold hover:underline focus-visible:underline focus-visible:outline-none"
        >
          {producto.nombre}
        </Link>
        <p className="mt-0.5 truncate text-xs text-muted-foreground tabular-nums">
          {producto.marca ? (
            <>
              <span className="sr-only">Marca </span>
              {formatNombreComercial(producto.marca)} ·{" "}
            </>
          ) : null}
          SKU {producto.sku}
        </p>
        {linea.disponible && linea.precioUnitario !== null ? (
          <p className="text-xs text-muted-foreground tabular-nums">
            <span className="sr-only">Precio unitario </span>
            {formatCentavos(linea.precioUnitario)} c/u
          </p>
        ) : null}
        {linea.precioCambio ? (
          <p className="mt-0.5 flex items-center gap-1 text-xs font-medium">
            <RefreshCw className="size-3" aria-hidden="true" />
            El precio se actualizó
          </p>
        ) : null}
        {!linea.disponible ? (
          <p className="mt-0.5 text-xs font-medium">Ya no disponible</p>
        ) : null}
      </div>

      <div className="col-start-2 row-start-2 @xl:col-start-3 @xl:row-start-1">
        {linea.disponible ? (
          <div
            role="group"
            aria-label={`Cantidad de ${producto.nombre}`}
            className="flex w-fit items-center rounded-lg border border-[var(--color-border-strong)]"
          >
            <button
              type="button"
              aria-label="Quitar una unidad"
              disabled={ocupada || linea.cantidad <= 1}
              onClick={() => fijarCantidad(linea.cantidad - 1)}
              className="flex size-8 items-center justify-center rounded-l-lg hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:opacity-40"
            >
              <Minus className="size-3.5" aria-hidden="true" />
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
              className="h-8 w-12 [appearance:textfield] border-x border-[var(--color-border)] bg-background text-center text-sm tabular-nums focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <button
              type="button"
              aria-label="Agregar una unidad"
              disabled={ocupada || linea.cantidad >= CANTIDAD_MAXIMA}
              onClick={() => fijarCantidad(linea.cantidad + 1)}
              className="flex size-8 items-center justify-center rounded-r-lg hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:opacity-40"
            >
              <Plus className="size-3.5" aria-hidden="true" />
            </button>
          </div>
        ) : null}
      </div>

      <p className="col-start-3 row-start-2 text-right text-base font-bold tabular-nums @xl:col-start-4 @xl:row-start-1">
        {linea.totalLinea !== null ? (
          <>
            <span className="sr-only">Total </span>
            {formatCentavos(linea.totalLinea)}
          </>
        ) : null}
      </p>

      <div className="col-start-3 row-start-1 self-start justify-self-end @xl:col-start-5 @xl:self-center">
        <JdhButton
          variant="destructive"
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
    </li>
  )
}

function CarritoSkeleton() {
  return (
    <div
      role="status"
      aria-label="Cargando carrito"
      className={cn("animate-pulse", COLUMNAS)}
    >
      <span className="sr-only">Cargando carrito…</span>
      <div className="flex flex-col gap-px overflow-hidden rounded-[var(--jdh-radius-md)] border border-[var(--color-border)]">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="flex items-center gap-3 p-3">
            <div className="size-16 shrink-0 rounded bg-[var(--color-surface-subtle)]" />
            <div className="flex flex-1 flex-col gap-2">
              <div className="h-4 w-3/4 rounded bg-[var(--color-surface-subtle)]" />
              <div className="h-3 w-32 rounded bg-[var(--color-surface-subtle)]" />
            </div>
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-3">
        <div className="h-24 rounded-[var(--jdh-radius-md)] bg-[var(--color-surface-subtle)]" />
        <div className="h-56 rounded-[var(--jdh-radius-md)] bg-[var(--color-surface-subtle)]" />
      </div>
    </div>
  )
}
