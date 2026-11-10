"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"

import { ScrollReveal } from "@/components/motion/scroll-reveal"
import { Stagger, StaggerItem } from "@/components/motion/stagger"
import { formatNombreComercial } from "@/lib/format"
import { urlImagenSitio } from "@/lib/site-assets"
import { iconoCategoria } from "@/modules/catalogo/categorias"
import { useCategorias } from "@/modules/catalogo/hooks/use-productos"
import { categoriaHref } from "@/modules/catalogo/navigation"

/** Las que caben en la grilla 3×3 de desktop. */
const MAX_DESTACADAS = 9
/** Subcategorías que asoman como texto de apoyo en cada tarjeta. */
const MAX_SUBCATEGORIAS_EN_TARJETA = 4

/**
 * Contenedor: PISTA deslizable en móvil, grilla desde `sm`. La pista SANGRA
 * hasta el borde del viewport (`-mx-6 px-6`, contra el `px-6` del wrapper de
 * `InicioView`) para que la tarjeta siguiente asome cortada: es la única señal
 * de que hay más, porque la barra de scroll va oculta.
 *
 * Scroll LIBRE, sin `scroll-snap`, y `overflow-y-hidden` obligatorio — por lo
 * mismo que en `value-props.tsx`. Ver `inicio-view.tsx`.
 */
const CLASES_PISTA =
  "no-scrollbar -mx-6 flex gap-4 overflow-x-auto overflow-y-hidden overscroll-x-contain px-6 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-3"
/** Alto de pista compartido con las otras dos del homepage (`--jdh-card-movil`). */
const CLASES_ITEM =
  "h-[var(--jdh-card-movil)] w-[58%] shrink-0 sm:h-full sm:w-auto"
const CLASES_TARJETA =
  "relative isolate flex h-full flex-col gap-3 overflow-hidden rounded-[var(--jdh-radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 sm:flex-row sm:items-start sm:gap-4"

/**
 * Banner de la categoría como fondo desvanecido de su tarjeta. Es el mismo
 * archivo que usa el banner del listado (`site/banners/{slug}.webp`), así que
 * no hay nada nuevo que subir. Va muy tenue (opacidad baja) y con una máscara
 * que lo funde hacia la izquierda, donde está el texto: el arte compone el
 * producto a la derecha, y de ese modo ni el ícono ni el nombre pierden
 * contraste. Decorativo (`alt=""`).
 *
 * Si la categoría no tiene pieza (`servicios`, `otros`, 404) o no hay bucket,
 * la tarjeta queda como estaba.
 */
function FondoCategoria({ slug }: { slug: string }) {
  const [fallo, setFallo] = React.useState(false)
  const src = urlImagenSitio("banners", slug)
  if (!src || fallo) return null

  return (
    <Image
      src={src}
      alt=""
      fill
      sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 60vw"
      onError={() => setFallo(true)}
      className="-z-10 object-cover object-right opacity-[0.22] [mask-image:linear-gradient(to_left,black_15%,transparent_95%)] dark:opacity-[0.3]"
    />
  )
}

/**
 * Grilla de CATEGORÍAS DESTACADAS del e-commerce: las 9 de mayor volumen de
 * `GET /categories`, la misma taxonomía del panel de filtros y del megamenú.
 * Cada tarjeta lleva al catálogo filtrado por esa categoría.
 *
 * Es una sección del CATÁLOGO: pide su data desde el cliente y se OCULTA si el
 * API no responde o no trae categorías (ver `InicioView`), así `/` sigue
 * prerenderizada sin depender de que el API esté arriba en build. Mientras
 * llega dibuja la misma grilla con esqueletos, para que no haya salto.
 *
 * En móvil la tarjeta es vertical (pista); desde `sm` es horizontal, ícono a
 * la izquierda: 3×3 desde `lg`.
 */
export function CategoriasSection() {
  const { data, isPending } = useCategorias()

  const destacadas = (data ?? [])
    .slice()
    .sort((a, b) => b.totalProductos - a.totalProductos)
    .slice(0, MAX_DESTACADAS)

  if (!isPending && destacadas.length === 0) return null

  return (
    <section
      aria-labelledby="categorias-grid-title"
      className="flex flex-col gap-8"
    >
      <ScrollReveal>
        <div className="flex flex-col gap-2">
          <h2
            id="categorias-grid-title"
            className="text-2xl font-bold tracking-tight text-balance sm:text-3xl"
          >
            Encuentra lo que tu operación necesita
          </h2>
        </div>
      </ScrollReveal>

      {isPending ? (
        <div
          className={CLASES_PISTA}
          role="status"
          aria-label="Cargando categorías"
        >
          {Array.from({ length: MAX_DESTACADAS }, (_, i) => (
            <div key={i} className={CLASES_ITEM} aria-hidden="true">
              <div className={`${CLASES_TARJETA} animate-pulse`}>
                <span className="size-10 shrink-0 rounded-[var(--jdh-radius-sm)] bg-[var(--color-surface-subtle)]" />
                <span className="flex min-w-0 flex-1 flex-col gap-2">
                  <span className="h-4 w-2/3 rounded bg-[var(--color-surface-subtle)]" />
                  <span className="h-3 w-full rounded bg-[var(--color-surface-subtle)]" />
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Stagger
          staggerDelay={0.03}
          // Enfocable mientras es pista: sin un tab stop el contenido fuera
          // de pantalla solo se alcanzaría con el dedo (WCAG 2.2 SC 2.1.1).
          // Mismo criterio que `ValueProps`.
          tabIndex={0}
          role="group"
          aria-label="Categorías destacadas"
          className={CLASES_PISTA}
        >
          {destacadas.map((categoria) => {
            const Icono = iconoCategoria(categoria.slug)
            return (
              <StaggerItem key={categoria.id} className={CLASES_ITEM}>
                <Link
                  href={categoriaHref(categoria)}
                  className={`${CLASES_TARJETA} transition-colors outline-none hover:bg-[var(--color-surface-subtle)] focus-visible:outline-2 focus-visible:outline-ring`}
                >
                  <FondoCategoria slug={categoria.slug} />
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-[var(--jdh-radius-sm)] bg-[var(--color-surface-subtle)] text-foreground">
                    <Icono className="size-5" aria-hidden="true" />
                  </span>
                  <span className="flex min-w-0 flex-col gap-1">
                    <span className="text-sm font-medium text-balance">
                      {formatNombreComercial(categoria.nombre)}
                    </span>
                    <span className="line-clamp-3 text-xs text-muted-foreground sm:line-clamp-2">
                      {categoria.subcategorias
                        .slice(0, MAX_SUBCATEGORIAS_EN_TARJETA)
                        .map((sub) => formatNombreComercial(sub.nombre))
                        .join(" · ")}
                    </span>
                  </span>
                </Link>
              </StaggerItem>
            )
          })}
        </Stagger>
      )}
    </section>
  )
}
