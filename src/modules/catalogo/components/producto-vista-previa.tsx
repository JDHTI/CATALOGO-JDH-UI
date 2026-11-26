"use client"

import * as React from "react"
import Link from "next/link"
import type { Route } from "next"
import { ArrowRight, XIcon } from "lucide-react"
import { Dialog as DialogPrimitive, Slot } from "radix-ui"

import { JdhButton } from "@/components/common/jdh-button"
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
} from "@/components/ui/dialog"
import { formatNombreComercial } from "@/lib/format"

import type { Producto } from "../types"
import { PrecioEmpleado } from "./precio-empleado"
import { ProductoImagen } from "./producto-imagen"

/**
 * Cuánto tiene que DESCANSAR el ratón sobre la card para abrir la vista
 * previa (1 s; con 2 s se sentía lenta). Sigue siendo largo a propósito: al recorrer una grilla con el ratón no debe
 * ir saltando un modal por cada card que se cruza, solo cuando alguien se
 * detiene a mirar una.
 */
export const VISTA_PREVIA_DELAY_MS = 1000

/**
 * Vista previa de un producto: un modal CENTRADO, con el fondo desenfocado,
 * que se abre cuando el ratón se queda `VISTA_PREVIA_DELAY_MS` sobre la card.
 * Muestra la imagen grande, el nombre completo (la card lo corta a dos
 * renglones), la descripción y la ficha resumida, sin salir del listado. La
 * card sigue navegando al detalle con un clic, y la vista previa trae su
 * propio «Ver detalle».
 *
 * Antes era un `HoverCard` anclado al costado de la card. Se cambió a modal
 * porque el panel lateral quedaba pequeño para la imagen y competía con las
 * cards vecinas; centrado y con desenfoque se lee como lo que es, una ficha.
 *
 * Es una mejora SOLO para ratón:
 * - En táctil no se abre (`pointerType !== "mouse"`): el tap navega como
 *   siempre.
 * - El foco del teclado NO la abre. Un modal que salta solo al tabular
 *   atraparía el foco en cada card de la grilla; el enlace de la card ya
 *   lleva a la ficha completa.
 *
 * Se cierra con clic fuera, Esc o la X. Al cerrarse, el ratón casi siempre
 * vuelve a quedar sobre la misma card; para que no se reabra al segundo, el temporizador no se rearma hasta que el puntero sale de ella.
 *
 * El contenido solo se monta con el modal abierto (el portal de Radix no
 * renderiza nada cerrado), así que la card cerrada no lleva al DOM ni la
 * descripción larga ni un segundo enlace.
 */
export function ProductoVistaPrevia({
  producto,
  children,
}: {
  producto: Producto
  /** El contenedor de la card. Debe aceptar `ref` y props (un elemento DOM). */
  children: React.ReactNode
}) {
  const [abierta, setAbierta] = React.useState(false)
  const temporizador = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  /** `true` desde que se cierra hasta que el puntero sale de la card. */
  const enEspera = React.useRef(false)

  const cancelar = React.useCallback(() => {
    if (temporizador.current) clearTimeout(temporizador.current)
    temporizador.current = null
  }, [])

  React.useEffect(() => cancelar, [cancelar])

  function alEntrar(evento: React.PointerEvent) {
    if (evento.pointerType !== "mouse" || enEspera.current) return
    cancelar()
    temporizador.current = setTimeout(() => {
      temporizador.current = null
      setAbierta(true)
    }, VISTA_PREVIA_DELAY_MS)
  }

  function alSalir() {
    cancelar()
    enEspera.current = false
  }

  function alCambiar(abrir: boolean) {
    setAbierta(abrir)
    if (!abrir) enEspera.current = true
  }

  return (
    <Dialog open={abierta} onOpenChange={alCambiar}>
      {/* Un clic (o el inicio de un arrastre) es una decisión: el temporizador
          no debe abrir el modal encima de la navegación que ya empezó. */}
      <Slot.Root
        onPointerEnter={alEntrar}
        onPointerLeave={alSalir}
        onPointerDown={cancelar}
      >
        {children}
      </Slot.Root>
      <ContenidoVistaPrevia producto={producto} />
    </Dialog>
  )
}

function ContenidoVistaPrevia({ producto }: { producto: Producto }) {
  const href = `/productos/${encodeURIComponent(producto.id)}` as Route
  const categoria = [producto.categoria?.nombre, producto.subcategoria?.nombre]
    .filter(Boolean)
    .join(" › ")
  const filas = [
    ["Proveedor", formatNombreComercial(producto.proveedor.nombre)],
    ["Fabricante", formatNombreComercial(producto.fabricante)],
    ["Categoría", categoria],
  ].filter(([, valor]) => valor)

  return (
    <DialogPortal>
      {/* Más opaco y más desenfocado que el overlay por defecto del primitivo
          (`bg-black/10`, `blur-xs`): la grilla de atrás tiene que pasar a
          segundo plano para que la ficha se lea como foco único. */}
      <DialogOverlay className="bg-black/40 supports-backdrop-filter:backdrop-blur-md" />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        // Lo abrió el ratón, no el teclado: el foco va al contenedor y no a
        // la X, que si no aparecía rodeada de su anillo como si alguien la
        // hubiera tabulado. Tab sigue recorriendo el contenido desde ahí.
        onOpenAutoFocus={(evento) => {
          evento.preventDefault()
          ;(evento.currentTarget as HTMLElement | null)?.focus()
        }}
        className="fixed top-1/2 left-1/2 z-50 flex max-h-[85vh] w-[calc(100%-2rem)] max-w-3xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[var(--jdh-radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-foreground shadow-xl duration-150 outline-none data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95"
      >
        <div
          data-lenis-prevent
          className="grid flex-1 gap-6 overflow-y-auto p-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] md:p-6"
        >
          <ProductoImagen
            producto={producto}
            variant="detalle"
            sizes="(min-width: 768px) 22rem, 90vw"
            className="aspect-square w-full self-start rounded-[var(--jdh-radius-sm)]"
          />

          <div className="flex min-w-0 flex-col gap-4">
            <div className="flex flex-col gap-1.5 pr-8">
              {producto.marca ? (
                <p className="truncate text-xs font-medium tracking-wide text-muted-foreground">
                  {formatNombreComercial(producto.marca)}
                </p>
              ) : null}
              <DialogTitle className="text-xl leading-snug font-bold break-words">
                {producto.nombre}
              </DialogTitle>
              <DialogDescription className="text-xs tabular-nums">
                SKU {producto.sku}
              </DialogDescription>
            </div>

            {producto.descripcionLarga ? (
              <p className="line-clamp-6 text-sm leading-relaxed text-muted-foreground">
                {producto.descripcionLarga}
              </p>
            ) : null}

            {filas.length > 0 ? (
              <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-2 text-sm">
                {filas.map(([termino, valor]) => (
                  <div key={termino} className="contents">
                    <dt className="text-muted-foreground">{termino}</dt>
                    <dd className="font-medium break-words">{valor}</dd>
                  </div>
                ))}
              </dl>
            ) : null}

            <div className="mt-auto flex flex-wrap items-end justify-between gap-3 border-t border-[var(--color-border)] pt-4">
              <PrecioEmpleado producto={producto} variante="card" />
              <JdhButton asChild className="ml-auto shrink-0">
                <Link href={href}>
                  Ver detalle
                  <ArrowRight aria-hidden="true" />
                </Link>
              </JdhButton>
            </div>
          </div>
        </div>

        <DialogClose asChild>
          <JdhButton
            variant="ghost"
            size="icon"
            aria-label="Cerrar vista previa"
            className="absolute top-3 right-3"
          >
            <XIcon aria-hidden="true" />
          </JdhButton>
        </DialogClose>
      </DialogPrimitive.Content>
    </DialogPortal>
  )
}
