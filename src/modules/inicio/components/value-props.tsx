"use client"

import { BadgeCheck, Headset, Tag, Truck } from "lucide-react"

import { Stagger, StaggerItem } from "@/components/motion/stagger"

const VALUE_PROPS = [
  {
    icon: Truck,
    title: "Entrega en 7 ciudades",
    description:
      "Cobertura propia en Medellín, Bogotá, Armenia, Bucaramanga, Urabá, Cartagena y Barranquilla.",
  },
  {
    icon: Tag,
    title: "Precios de lista pública",
    description:
      "Compra sin intermediarios: lo que ves es lo que pagas, sin sorpresas en el pedido.",
  },
  {
    icon: Headset,
    title: "Soporte 24/7",
    description:
      "Acompañamiento logístico y comercial en cada pedido, todos los días del año.",
  },
  {
    icon: BadgeCheck,
    title: "Calidad institucional",
    description:
      "Más de 30 años abasteciendo hoteles, restaurantes, colegios y retail en Colombia.",
  },
] as const

/**
 * Sección de cobertura y precios de lista: full-bleed negra en tema claro y
 * blanca en tema oscuro, pegada al hero. Las 4 propuestas de valor son
 * CARDS INDEPENDIENTES (cada una con su borde hairline `--color-ink-border`,
 * separadas por gap) con texto en tokens on-ink y hover con overlay sutil.
 *
 * El padding vertical es simétrico (--space-16 móvil / --space-24 desktop):
 * el margen contra el hero arriba y contra la siguiente sección abajo es el
 * mismo.
 *
 * En MÓVIL (<`sm`) las cards NO se apilan: el contenedor colapsa a una pista
 * deslizable horizontal con scroll-snap. Apiladas, la franja negra medía
 * cuatro pantallas justo debajo del hero y empujaba el resto del catálogo
 * fuera de la vista; en carrusel ocupa una. Desde `sm` el mismo contenedor
 * vuelve a ser la grilla (2 columnas, 4 en `lg`) sin duplicar el marcado:
 * `flex` → `sm:grid` y el ancho porcentual de las cards → `sm:w-auto`.
 */
export function ValueProps() {
  return (
    <section
      aria-label="Por qué comprar en el catálogo JDH"
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
        data-lenis-prevent=""
        // `scroll-pl-4` iguala al `px-4`: sin él, `snap-mandatory` alinea la
        // primera card con el borde del scrollport y se come la canaleta
        // izquierda en cuanto el usuario suelta el gesto.
        className="mx-auto no-scrollbar flex w-full max-w-[var(--container-wide)] snap-x snap-mandatory scroll-pl-4 gap-4 overflow-x-auto overscroll-x-contain px-4 py-[var(--space-16)] sm:grid sm:snap-none sm:grid-cols-2 sm:overflow-visible sm:px-6 lg:grid-cols-4 lg:gap-6 lg:py-[var(--space-24)]"
      >
        {VALUE_PROPS.map(({ icon: Icon, title, description }) => (
          <StaggerItem
            key={title}
            className="h-full w-[82%] shrink-0 snap-start sm:w-auto"
          >
            <div className="flex h-full flex-col gap-3 rounded-[var(--jdh-radius-md)] border border-[var(--color-ink-border)] bg-[var(--color-ink)] p-6 text-[var(--color-on-ink)] transition-colors duration-[var(--duration-fast)] hover:bg-[var(--overlay-on-dark-04)] dark:border-[var(--color-paper-border)] dark:bg-[var(--color-paper)] dark:text-[var(--color-on-paper)] dark:hover:bg-[var(--color-paper-hover)]">
              <span className="flex size-10 items-center justify-center rounded-[var(--jdh-radius-sm)] bg-[var(--overlay-on-dark-08)] text-[var(--color-on-ink)] dark:bg-[var(--color-paper-hover)] dark:text-[var(--color-on-paper)]">
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <h2 className="text-base font-medium">{title}</h2>
              <p className="text-sm text-[var(--color-on-ink-muted)] dark:text-[var(--color-on-paper-muted)]">
                {description}
              </p>
            </div>
          </StaggerItem>
        ))}
      </Stagger>
    </section>
  )
}
