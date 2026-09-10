import Link from "next/link"
import type { Route } from "next"
import { Package, Store } from "lucide-react"

import { formatNombreComercial } from "@/lib/format"
import { FavoritoBoton } from "@/modules/favoritos/components/favorito-boton"

import type { Producto } from "../types"
import { ProductoImagen } from "./producto-imagen"

/**
 * Card de producto del catálogo — única card de producto de la app, usada
 * por el listado (`/productos`) y por la muestra del homepage. El catálogo
 * es solo referencia visual: identifica el producto (imagen, marca, nombre,
 * sku) y su proveedor, el eje principal de clasificación. Toda la card
 * navega al detalle.
 *
 * El contrato no publica un resumen editorial para tarjetas. La descripción
 * SEO pertenece a los metadatos y la larga a la ficha; ninguna se reutiliza
 * aquí para evitar llamadas comerciales y texto genérico en el listado.
 */
export function ProductoCard({ producto }: { producto: Producto }) {
  return (
    <article className="group relative h-full overflow-hidden rounded-[var(--jdh-radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] transition-[border-color,transform] duration-200 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 hover:-translate-y-0.5 hover:border-[var(--color-border-strong)]">
      {/* HERMANO del enlace, no hijo: la card entera navega al detalle, y un
          botón dentro de un enlace es HTML inválido además de dejar el foco y
          los lectores de pantalla en un estado ambiguo. Se superpone con
          `absolute` y el propio botón detiene la propagación del clic. */}
      <FavoritoBoton
        productoId={producto.id}
        nombreProducto={producto.nombre}
        className="absolute top-2 right-2 z-10"
      />
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
          sizes="(min-width: 1280px) 25vw, (min-width: 768px) 33vw, 50vw"
          className="aspect-square w-full"
        />

        <div className="flex flex-1 flex-col gap-2 p-4">
          <div className="flex flex-col gap-1">
            {/* La marca va SIN `uppercase`: el nombre real del ERP ya viene
                en mayúsculas y puede traer forma jurídica ("NESTLE DE
                COLOMBIA S.A."); forzarlas otra vez lo hace ilegible. */}
            {producto.marca ? (
              <p className="truncate text-xs font-medium tracking-wide text-muted-foreground">
                {formatNombreComercial(producto.marca)}
              </p>
            ) : null}
            <h3 className="text-sm font-medium text-balance">
              {producto.nombre}
            </h3>
            <p className="text-xs text-muted-foreground tabular-nums">
              {producto.sku}
            </p>
          </div>

          {/* SLOT DE PRECIO (oculto a propósito): sin precios definidos en el
              backend todavía. Cuando existan, el bloque va aquí, encima del
              proveedor, resuelto vía PriceContext — nunca improvisado. */}

          <p className="mt-auto flex items-center gap-1.5 border-t border-[var(--color-border)] pt-3 text-xs text-muted-foreground">
            <Store className="size-3.5 shrink-0" aria-hidden="true" />
            <span className="truncate">
              {formatNombreComercial(producto.proveedor.nombre)}
            </span>
          </p>
        </div>
      </Link>
    </article>
  )
}

/**
 * Card FANTASMA: la misma silueta, sin animación de carga, para cuando el
 * catálogo todavía no tiene productos. Un esqueleto que late diría "esto
 * está cargando" y no es el caso — aquí no hay nada que esperar, solo se
 * está mostrando la forma que tendrá la sección.
 */
export function ProductoCardFantasma() {
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
      <div className="flex flex-col gap-2 p-4">
        <div className="h-3 w-16 rounded bg-[var(--color-surface-subtle)]" />
        <div className="h-4 w-4/5 rounded bg-[var(--color-surface-subtle)]" />
        <div className="h-3 w-24 rounded bg-[var(--color-surface-subtle)]" />
        <div className="mt-3 h-3 w-28 rounded bg-[var(--color-surface-subtle)]" />
      </div>
    </div>
  )
}

/** Esqueleto de la card mientras responde el API (misma silueta). */
export function ProductoCardSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="h-full animate-pulse overflow-hidden rounded-[var(--jdh-radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)]"
    >
      <div className="aspect-square w-full bg-[var(--color-surface-subtle)]" />
      <div className="flex flex-col gap-2 p-4">
        <div className="h-3 w-16 rounded bg-[var(--color-surface-subtle)]" />
        <div className="h-4 w-4/5 rounded bg-[var(--color-surface-subtle)]" />
        <div className="h-3 w-24 rounded bg-[var(--color-surface-subtle)]" />
        <div className="mt-3 h-3 w-28 rounded bg-[var(--color-surface-subtle)]" />
      </div>
    </div>
  )
}
