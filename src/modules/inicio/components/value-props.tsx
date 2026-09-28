"use client"

import { Award, Boxes, Handshake, Truck } from "lucide-react"

import { Stagger, StaggerItem } from "@/components/motion/stagger"

/**
 * Cifras institucionales. Las descripciones se mantienen por debajo de ~110
 * caracteres: en la pista móvil la card tiene alto fijo y recorta a 3 líneas.
 * Los 31 años cuentan desde 1995 — actualizar el número cada año.
 */
const VALUE_PROPS = [
  {
    icon: Truck,
    title: "Entregas a nivel nacional",
    description:
      "Despachamos a todo el territorio colombiano desde nuestras sedes regionales, con logística propia.",
  },
  {
    icon: Boxes,
    title: "Más de 3.000 referencias",
    description:
      "Despensa, bebidas, aseo, desechables y menaje para tu operación, en un solo proveedor.",
  },
  {
    icon: Handshake,
    title: "Más de 300 proveedores",
    description:
      "Aliados con marcas líderes nacionales e internacionales para asegurar surtido y disponibilidad.",
  },
  {
    icon: Award,
    title: "31 años de experiencia",
    description:
      "Desde 1995 abastecemos a hoteles, restaurantes, instituciones y comercios de Food Service y Retail.",
  },
] as const

/**
 * Sección de cifras institucionales: full-bleed negra en tema claro y
 * blanca en tema oscuro, pegada al hero. Las 4 propuestas de valor son
 * CARDS INDEPENDIENTES (cada una con su borde hairline `--color-ink-border`,
 * separadas por gap) con texto en tokens on-ink y hover con overlay sutil.
 *
 * El padding vertical es simétrico (--space-16 móvil / --space-24 desktop):
 * el margen contra el hero arriba y contra la siguiente sección abajo es el
 * mismo.
 *
 * En MÓVIL (<`sm`) las cards NO se apilan: el contenedor colapsa a una pista
 * deslizable horizontal, de scroll LIBRE. Apiladas, la franja negra medía
 * cuatro pantallas justo debajo del hero y empujaba el resto del catálogo
 * fuera de la vista; en carrusel ocupa una. Desde `sm` el mismo contenedor
 * vuelve a ser la grilla (2 columnas, 4 en `lg`) sin duplicar el marcado:
 * `flex` → `sm:grid` y el ancho porcentual de las cards → `sm:w-auto`.
 *
 * La ALTURA en móvil es `--jdh-card-movil`, el mismo token que usan las otras
 * dos pistas del homepage; esta card es el caso que fija su valor. Ver el
 * token en `globals.css`.
 */
export function ValueProps() {
  return (
    <section
      aria-label="JDH en cifras"
      className="bg-[var(--color-ink)] dark:bg-[var(--color-paper)]"
    >
      <Stagger
        staggerDelay={0.08}
        // Enfocable A PROPÓSITO mientras es pista: las 4 cards son texto, no
        // enlaces, así que sin un tab stop en el scroller el contenido fuera
        // de pantalla solo se alcanzaría con el dedo (WCAG 2.2 SC 2.1.1). El
        // precio es un tab stop de más en desktop, donde ya no hay nada que
        // desplazar — se acepta antes que decidir el layout con JS y arriesgar
        // un salto de hidratación en la sección pegada al hero.
        tabIndex={0}
        role="group"
        aria-label="Propuestas de valor"
        // `overflow-y-hidden` NO es decorativo: `overflow-x: auto` deja el eje
        // Y en `auto` por cascada (CSS Overflow §3.2), así que la pista se
        // volvía también contenedor de scroll vertical y se comía el gesto de
        // arrastre de la página antes de encadenarlo — el "brinco" al pasar
        // el dedo por la franja. En `hidden` deja de ser desplazable por el
        // usuario y el gesto vertical vuelve a la página. Ver `inicio-view`.
        className="mx-auto no-scrollbar flex w-full max-w-[var(--container-wide)] gap-4 overflow-x-auto overflow-y-hidden overscroll-x-contain px-4 py-[var(--space-16)] sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-6 lg:grid-cols-4 lg:gap-6 lg:py-[var(--space-24)]"
      >
        {VALUE_PROPS.map(({ icon: Icon, title, description }) => (
          <StaggerItem
            key={title}
            className="h-[var(--jdh-card-movil)] w-[82%] shrink-0 sm:h-full sm:w-auto"
          >
            <div className="flex h-full flex-col gap-3 rounded-[var(--jdh-radius-md)] border border-[var(--color-ink-border)] bg-[var(--color-ink)] p-6 text-[var(--color-on-ink)] transition-colors duration-[var(--duration-fast)] hover:bg-[var(--overlay-on-dark-04)] dark:border-[var(--color-paper-border)] dark:bg-[var(--color-paper)] dark:text-[var(--color-on-paper)] dark:hover:bg-[var(--color-paper-hover)]">
              <span className="flex size-10 items-center justify-center rounded-[var(--jdh-radius-sm)] bg-[var(--overlay-on-dark-08)] text-[var(--color-on-ink)] dark:bg-[var(--color-paper-hover)] dark:text-[var(--color-on-paper)]">
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <h2 className="text-base font-medium">{title}</h2>
              {/* `line-clamp-3` sostiene la altura fija de la pista: la card
                  ya no crece con el copy, así que una descripción más larga
                  que las de hoy se recortaría en vez de desbordar. Desde `sm`
                  la fila iguala las alturas y el texto va completo. */}
              <p className="line-clamp-3 text-sm text-[var(--color-on-ink-muted)] sm:line-clamp-none dark:text-[var(--color-on-paper-muted)]">
                {description}
              </p>
            </div>
          </StaggerItem>
        ))}
      </Stagger>
    </section>
  )
}
