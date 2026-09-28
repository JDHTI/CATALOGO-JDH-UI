"use client"

import { ScrollReveal } from "@/components/motion/scroll-reveal"
import { Stagger, StaggerItem } from "@/components/motion/stagger"
import { CATEGORIAS_CATALOGO } from "@/modules/catalogo/categorias"

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

/**
 * Grilla de CATEGORÍAS del e-commerce — la taxonomía propuesta en
 * `CategorizacionEcommerce.xlsx` (ver `@/modules/catalogo/categorias`).
 *
 * Las tarjetas NO son enlaces todavía: los productos no traen categoría y
 * `/productos` no lee `?categoria=`, así que enlazarlas llevaría al catálogo
 * completo sin filtrar — una promesa que la página no cumple. Cuando el API
 * publique las categorías, cada tarjeta pasa a `<Link>` con su filtro y la
 * lista estática se cambia por la query.
 *
 * En móvil la tarjeta es vertical (pista); desde `sm` es horizontal, ícono a
 * la izquierda, para que 21 categorías quepan en siete filas compactas.
 */
export function CategoriasSection() {
  return (
    <section
      aria-labelledby="categorias-grid-title"
      className="flex flex-col gap-8"
    >
      <ScrollReveal>
        <div className="flex flex-col gap-2">
          <p className="font-mono text-xs tracking-[0.08em] text-muted-foreground uppercase">
            Explora por categoría
          </p>
          <h2
            id="categorias-grid-title"
            className="text-2xl font-bold tracking-tight text-balance sm:text-3xl"
          >
            Encuentra lo que tu operación necesita
          </h2>
        </div>
      </ScrollReveal>

      <Stagger
        staggerDelay={0.03}
        // Enfocable mientras es pista: las tarjetas son texto, no enlaces, y
        // sin un tab stop el contenido fuera de pantalla solo se alcanzaría
        // con el dedo (WCAG 2.2 SC 2.1.1). Mismo criterio que `ValueProps`.
        tabIndex={0}
        role="group"
        aria-label="Categorías del catálogo"
        className={CLASES_PISTA}
      >
        {CATEGORIAS_CATALOGO.map(
          ({ codigo, nombre, icono: Icono, subcategorias }) => (
            <StaggerItem key={codigo} className={CLASES_ITEM}>
              <div className="flex h-full flex-col gap-3 rounded-[var(--jdh-radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 sm:flex-row sm:items-start sm:gap-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-[var(--jdh-radius-sm)] bg-[var(--color-surface-subtle)] text-foreground">
                  <Icono className="size-5" aria-hidden="true" />
                </span>
                <span className="flex min-w-0 flex-col gap-1">
                  <span className="text-sm font-medium text-balance">
                    {nombre}
                  </span>
                  <span className="line-clamp-3 text-xs text-muted-foreground sm:line-clamp-2">
                    {subcategorias.join(" · ")}
                  </span>
                </span>
              </div>
            </StaggerItem>
          )
        )}
      </Stagger>
    </section>
  )
}
