import Link from "next/link"
import type { Route } from "next"
import { Package, Store } from "lucide-react"

import { formatNombreComercial } from "@/lib/format"
import { cn } from "@/lib/utils"
import {
  AgregarAlCarritoIcono,
  sePuedeComprar,
} from "@/modules/carrito/components/agregar-al-carrito"
import { FavoritoBoton } from "@/modules/favoritos/components/favorito-boton"

import type { Producto } from "../types"
import { PrecioEmpleado } from "./precio-empleado"
import { ProductoImagen } from "./producto-imagen"
import { ProductoVistaPrevia } from "./producto-vista-previa"

/**
 * Card de producto del catálogo — única card de producto de la app, usada
 * por el listado (`/productos`) y por la muestra del homepage. El catálogo
 * es solo referencia visual: identifica el producto (imagen, marca, nombre,
 * sku) y su proveedor, el eje principal de clasificación. Toda la card
 * navega al detalle; con el ratón encima abre además una vista previa
 * (`ProductoVistaPrevia`) con el nombre completo y la ficha resumida.
 *
 * La franja inferior es del PRECIO de empleado, no del proveedor: es el dato
 * que se compara de card a card y queda alineado en la base de la grilla.
 * Para anónimos y clientes no hay precio y la franja no se pinta.
 *
 * El contrato no publica un resumen editorial para tarjetas. La descripción
 * SEO pertenece a los metadatos y la larga a la ficha; ninguna se reutiliza
 * aquí para evitar llamadas comerciales y texto genérico en el listado.
 */
export function ProductoCard({
  producto,
  densidad = "normal",
}: {
  producto: Producto
  /**
   * `compacta` la usa la muestra del homepage (grilla 4×3): menos relleno y
   * texto un punto más chico para que entren doce referencias sin que la
   * sección se vuelva un muro. La SILUETA no cambia (imagen cuadrada arriba,
   * datos abajo), así que fantasma y esqueleto siguen sirviendo.
   */
  densidad?: "normal" | "compacta"
}) {
  const compacta = densidad === "compacta"
  return (
    /*
     * La vista previa envuelve el contenedor completo (corazón y carrito
     * incluidos): pasar el ratón por esos botones no debe cerrarla.
     *
     * El botón de favorito va FUERA del `<article>`, no dentro.
     *
     * El anillo de foco de la card es `focus-within`, así que lo dispara
     * cualquier descendiente enfocado. Con el corazón dentro, marcarlo con el
     * ratón rodeaba la card entera de un anillo negro (`--ring` es
     * `--neutral-900`), que se leía como una selección accidental.
     *
     * Sacarlo a hermano lo resuelve por estructura y no por selector: el
     * `focus-within` del artículo sigue haciendo lo único para lo que existe
     * —señalar qué card tiene el foco al tabular— y el botón se señala solo,
     * con el `:focus-visible` global. Se intentó antes acotarlo con
     * `has-[a:focus-visible]`, que sí quitaba el anillo del botón pero
     * tampoco lo pintaba al tabular al enlace: quitaba el problema y la
     * función a la vez.
     *
     * Tampoco podía ir dentro del `<a>`: un botón anidado en un enlace es
     * HTML inválido y deja el foco y los lectores de pantalla en un estado
     * ambiguo.
     */
    <ProductoVistaPrevia producto={producto}>
      <div className="relative h-full">
        <FavoritoBoton
          sobreImagen
          productoId={producto.id}
          nombreProducto={producto.nombre}
          className="absolute top-2 right-2 z-10"
        />
        {/* Carrito de EMPLEADOS: fuera del `<article>` por la misma razón que
          el corazón (ver arriba). Solo aparece si el dato trae precio de
          empleado; se apoya sobre la franja del precio, que le reserva el
          hueco con `pr-12`. */}
        <AgregarAlCarritoIcono
          producto={producto}
          className={cn(
            "absolute z-10",
            compacta ? "right-3 bottom-3" : "right-4 bottom-4"
          )}
        />
        <article className="group h-full overflow-hidden rounded-[var(--jdh-radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] transition-transform duration-200 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 hover:-translate-y-0.5">
          <Link
            href={`/productos/${encodeURIComponent(producto.id)}` as Route}
            aria-label={`Ver detalle de ${producto.nombre}`}
            className="flex h-full flex-col focus-visible:outline-none"
          >
            {/* Recuadro CUADRADO, igual que el detalle y la miniatura del
            buscador: el master de producto es 1:1 y las tres variantes que
            genera el API (`thumb`/`card`/`full`) son cuadradas con relleno
            blanco, así que aquí no se recorta nada. Con el `aspect-[4/3]`
            anterior el `object-cover` se comía ~12.5% arriba y abajo del
            cuadrado, que es justo el aire que la guía de marca pide dejar
            alrededor del producto. Las tres siluetas de este archivo (real,
            fantasma y esqueleto) tienen que compartir esta relación o la
            card salta de alto al terminar de cargar. */}
            <ProductoImagen
              producto={producto}
              sizes={
                compacta
                  ? "(min-width: 1024px) 20vw, (min-width: 768px) 33vw, 50vw"
                  : "(min-width: 1280px) 25vw, (min-width: 768px) 33vw, 50vw"
              }
              className="aspect-square w-full"
            />

            <div
              className={cn(
                "flex flex-1 flex-col",
                compacta ? "gap-1.5 p-3" : "gap-2 p-4"
              )}
            >
              <div className="flex flex-col gap-1">
                {/* La marca va SIN `uppercase`: el nombre real del ERP ya viene
                en mayúsculas y puede traer forma jurídica ("NESTLE DE
                COLOMBIA S.A."); forzarlas otra vez lo hace ilegible. */}
                {producto.marca ? (
                  <p className="truncate text-xs font-medium tracking-wide text-muted-foreground">
                    {formatNombreComercial(producto.marca)}
                  </p>
                ) : null}
                {/* Máximo dos renglones con «…»: hay nombres del ERP muy largos
                que empujaban el resto de la card. El alto mínimo de dos
                renglones alinea SKU y proveedor entre cards de la misma
                fila. El texto completo sigue en el DOM (lectores de
                pantalla) y en la vista previa. */}
                <h3
                  className={cn(
                    "line-clamp-2 min-h-[2lh] font-medium break-words",
                    compacta ? "text-[0.8125rem] leading-snug" : "text-sm"
                  )}
                >
                  {producto.nombre}
                </h3>
                <p className="text-xs text-muted-foreground tabular-nums">
                  {producto.sku}
                </p>
                <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Store className="size-3.5 shrink-0" aria-hidden="true" />
                  <span className="truncate">
                    {formatNombreComercial(producto.proveedor.nombre)}
                  </span>
                </p>
              </div>

              {/* Precio de EMPLEADOS: solo existe en el dato cuando quien mira
              es personal JDH (ver `PrecioEmpleado`). Para el resto
              (`undefined`) no se pinta ni la franja. */}
              {producto.precioEmpleado !== undefined ? (
                <div
                  className={cn(
                    "mt-auto flex min-h-9 items-end border-t border-[var(--color-border)]",
                    compacta ? "pt-2" : "pt-3",
                    sePuedeComprar(producto) && "pr-12"
                  )}
                >
                  <PrecioEmpleado producto={producto} variante="card" />
                </div>
              ) : null}
            </div>
          </Link>
        </article>
      </div>
    </ProductoVistaPrevia>
  )
}

/**
 * Card FANTASMA: la misma silueta, sin animación de carga, para cuando el
 * catálogo todavía no tiene productos. Un esqueleto que late diría "esto
 * está cargando" y no es el caso — aquí no hay nada que esperar, solo se
 * está mostrando la forma que tendrá la sección.
 */
export function ProductoCardFantasma({
  densidad = "normal",
}: {
  densidad?: "normal" | "compacta"
}) {
  return (
    <div
      aria-hidden="true"
      className="h-full overflow-hidden rounded-[var(--jdh-radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)]"
    >
      <div className="flex aspect-square w-full items-center justify-center bg-[var(--color-surface-subtle)]">
        <Package
          className="size-10 text-muted-foreground opacity-30"
          strokeWidth={1.25}
          aria-hidden="true"
        />
      </div>
      <div
        className={cn(
          "flex flex-col",
          densidad === "compacta" ? "gap-1.5 p-3" : "gap-2 p-4"
        )}
      >
        <div className="h-3 w-16 rounded bg-[var(--color-surface-subtle)]" />
        <div className="h-4 w-4/5 rounded bg-[var(--color-surface-subtle)]" />
        <div className="h-3 w-24 rounded bg-[var(--color-surface-subtle)]" />
        <div className="mt-1 h-3 w-28 rounded bg-[var(--color-surface-subtle)]" />
      </div>
    </div>
  )
}

/** Esqueleto de la card mientras responde el API (misma silueta). */
export function ProductoCardSkeleton({
  densidad = "normal",
}: {
  densidad?: "normal" | "compacta"
}) {
  return (
    <div
      aria-hidden="true"
      className="h-full animate-pulse overflow-hidden rounded-[var(--jdh-radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)]"
    >
      <div className="aspect-square w-full bg-[var(--color-surface-subtle)]" />
      <div
        className={cn(
          "flex flex-col",
          densidad === "compacta" ? "gap-1.5 p-3" : "gap-2 p-4"
        )}
      >
        <div className="h-3 w-16 rounded bg-[var(--color-surface-subtle)]" />
        <div className="h-4 w-4/5 rounded bg-[var(--color-surface-subtle)]" />
        <div className="h-3 w-24 rounded bg-[var(--color-surface-subtle)]" />
        <div className="mt-1 h-3 w-28 rounded bg-[var(--color-surface-subtle)]" />
      </div>
    </div>
  )
}
