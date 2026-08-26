"use client"

import type { Route } from "next"
import Link from "next/link"
import {
  ArrowRight,
  ArrowUpRight,
  PackageSearch,
  TriangleAlert,
} from "lucide-react"

import { formatNombreComercial, formatNumero } from "@/lib/format"
import { cn } from "@/lib/utils"

import type { Producto } from "../types"
import { ProductoImagen } from "./producto-imagen"

/**
 * Panel de sugerencias del buscador del header — la lista de productos que
 * aparece MIENTRAS se teclea, en formato card-list: miniatura del producto a
 * la izquierda y su identificación (marca, nombre, sku, proveedor) al lado.
 * Es el mismo dato que la card del listado, comprimido a una fila: en una
 * sugerencia el usuario está confirmando "sí, este es el producto que busco",
 * y para eso la foto pesa más que cualquier texto.
 *
 * PRESENTACIONAL a propósito: no consulta el API ni conoce el estado del
 * combobox. El buscador (`ProductSearchBar`, en `components/layout/`) es
 * quien tiene el input, dispara `useBusquedaProductos` y lleva el índice
 * activo del teclado — necesita el número de opciones para acotar las
 * flechas, así que la query vive allí y aquí solo llega el resultado. Este
 * componente aporta lo que es del dominio catálogo: cómo se identifica un
 * producto de un vistazo y a dónde navega.
 *
 * ARIA: el contenedor con `role="listbox"` recibe las opciones como HIJOS
 * DIRECTOS (sin `ul`/`li` intermedios, que romperían la relación requerida
 * por el rol). Cada opción es un `Link` real —así el clic medio y "abrir en
 * pestaña nueva" funcionan— pero con `tabIndex={-1}`: se recorren con las
 * flechas desde el input, no con Tab. Los estados (cargando, error, vacío)
 * NO son opciones: van fuera del listbox, que en esos casos queda vacío.
 */
export function BusquedaSugerencias({
  productos,
  cargando,
  error,
  atenuado = false,
  termino,
  total,
  listboxId,
  opcionId,
  indiceActivo,
  onActivar,
  onCerrar,
  hrefVerTodos,
}: {
  productos: Producto[]
  cargando: boolean
  error: boolean
  /** `isPlaceholderData`: se muestran las sugerencias del término anterior. */
  atenuado?: boolean
  termino: string
  /** Total de coincidencias del API — el panel solo muestra las primeras. */
  total?: number
  listboxId: string
  opcionId: (indice: number) => string
  /** Índice resaltado por teclado; -1 si ninguno. */
  indiceActivo: number
  onActivar: (indice: number) => void
  /** Cerrar el panel: la navegación la hace el propio `Link`. */
  onCerrar: () => void
  hrefVerTodos: Route
}) {
  const sinResultados = !cargando && !error && productos.length === 0

  return (
    <div
      className={cn(
        "absolute top-[calc(100%+0.5rem)] right-0 left-0 z-[var(--z-popover)] overflow-hidden rounded-[var(--jdh-radius-md)] border border-[var(--color-border)] bg-popover text-popover-foreground shadow-[var(--shadow-lg)]",
        "motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-top-1"
      )}
    >
      {/* Con 5 sugerencias de alto fijo (76px cada una) la lista mide 380px y
          NO scrollea: el panel se lee entero de un vistazo, que es el punto de
          limitar a 5. El tope de 25rem y el `overflow` son la válvula de
          seguridad para un viewport corto de verdad (móvil en horizontal), no
          el modo normal. `svh` y no `vh` para que el teclado del móvil cuente.

          `data-lenis-prevent`: cuando SÍ le toca scrollear, sin esto el scroll
          smooth global se queda el gesto y la lista no se puede recorrer. */}
      <div
        data-lenis-prevent
        className="max-h-[min(70svh,25rem)] overflow-y-auto overscroll-contain"
      >
        <div
          id={listboxId}
          role="listbox"
          aria-label={`Sugerencias para ${termino}`}
          className={cn(
            "transition-opacity duration-[var(--duration-fast)]",
            atenuado && "opacity-60"
          )}
        >
          {productos.map((producto, indice) => (
            <FilaSugerencia
              key={producto.id}
              producto={producto}
              id={opcionId(indice)}
              activo={indice === indiceActivo}
              onActivar={() => onActivar(indice)}
              onCerrar={onCerrar}
            />
          ))}
        </div>

        {cargando && productos.length === 0 ? (
          <div aria-live="polite">
            <span className="sr-only">Buscando productos…</span>
            {Array.from({ length: 3 }, (_, indice) => (
              <FilaSugerenciaSkeleton key={indice} />
            ))}
          </div>
        ) : null}

        {error ? (
          <p className="flex items-start gap-2.5 px-3 py-4 text-sm text-muted-foreground">
            <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
            No pudimos cargar las sugerencias. Presiona Enter para buscar en el
            catálogo completo.
          </p>
        ) : null}

        {sinResultados ? (
          <p className="flex items-start gap-2.5 px-3 py-4 text-sm text-muted-foreground">
            <PackageSearch className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span className="min-w-0">
              Ningún producto se llama{" "}
              <span className="font-medium text-foreground">“{termino}”</span>.
              Prueba con menos palabras.
            </span>
          </p>
        ) : null}
      </div>

      {/* Salida al listado completo — SIEMPRE, incluso sin sugerencias: el
          panel muestra un puñado y el catálogo tiene filtros, así que "ver
          todo" no es una alternativa, es el paso siguiente natural. Fuera del
          `role="listbox"`: no es una opción de la lista, es un destino. */}
      <Link
        href={hrefVerTodos}
        onClick={onCerrar}
        className="flex items-center justify-between gap-3 border-t border-[var(--color-border)] px-3 py-2.5 text-xs font-medium transition-colors outline-none hover:bg-accent focus-visible:bg-accent"
      >
        <span className="flex min-w-0 items-center gap-1.5">
          <ArrowRight className="size-3.5 shrink-0" aria-hidden />
          <span className="truncate">
            Ver todo el catálogo para “{termino}”
          </span>
        </span>
        {typeof total === "number" && total > 0 ? (
          <span className="shrink-0 text-muted-foreground tabular-nums">
            {formatNumero(total)}
          </span>
        ) : null}
      </Link>
    </div>
  )
}

function FilaSugerencia({
  producto,
  id,
  activo,
  onActivar,
  onCerrar,
}: {
  producto: Producto
  id: string
  activo: boolean
  onActivar: () => void
  onCerrar: () => void
}) {
  return (
    <Link
      id={id}
      role="option"
      aria-selected={activo}
      tabIndex={-1}
      href={`/productos/${producto.id}` as Route}
      onClick={onCerrar}
      // `mousemove` y no `mouseenter`: al recorrer la lista con las flechas el
      // panel scrollea bajo un cursor quieto y `mouseenter` dispararía solo,
      // robándole el resaltado al teclado.
      onMouseMove={onActivar}
      className={cn(
        "group flex items-center gap-3 px-3 py-2.5 transition-colors outline-none",
        activo && "bg-accent"
      )}
    >
      <ProductoImagen
        producto={producto}
        variant="miniatura"
        sizes="56px"
        className="size-14 shrink-0 rounded-[var(--jdh-radius-sm)] border border-[var(--color-border)]"
      />

      <span className="min-w-0 flex-1">
        {/* Marca SIN `uppercase`: el nombre del ERP ya viene en mayúsculas
            (ver `ProductoCard`). */}
        {producto.marca ? (
          <span className="block truncate text-[11px] font-medium tracking-wide text-muted-foreground">
            {formatNombreComercial(producto.marca)}
          </span>
        ) : null}
        {/* Una línea, no `line-clamp-2`: con el nombre a dos líneas la fila
            pasa de 76px a 88px y las 5 sugerencias ya no caben sin scroll. El
            nombre completo está a un clic, en el detalle. */}
        <span className="block truncate text-sm font-medium">
          {producto.nombre}
        </span>
        <span className="mt-0.5 flex min-w-0 items-center gap-1.5 text-[11px] text-muted-foreground">
          <span className="shrink-0 tabular-nums">{producto.sku}</span>
          <span aria-hidden>·</span>
          <span className="truncate">
            {formatNombreComercial(producto.proveedor.nombre)}
          </span>
        </span>
      </span>

      <ArrowUpRight
        aria-hidden
        className={cn(
          "size-4 shrink-0 text-muted-foreground transition-opacity",
          activo ? "opacity-100" : "opacity-0"
        )}
      />
    </Link>
  )
}

/** Misma silueta y misma geometría de la fila (76px) mientras responde el API,
 *  para que la lista no salte al llegar los datos. */
function FilaSugerenciaSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="flex animate-pulse items-center gap-3 px-3 py-2.5"
    >
      <div className="size-14 shrink-0 rounded-[var(--jdh-radius-sm)] bg-[var(--color-surface-subtle)]" />
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="h-2.5 w-16 rounded bg-[var(--color-surface-subtle)]" />
        <div className="h-3.5 w-4/5 rounded bg-[var(--color-surface-subtle)]" />
        <div className="h-2.5 w-2/5 rounded bg-[var(--color-surface-subtle)]" />
      </div>
    </div>
  )
}
