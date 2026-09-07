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
 */
export function ValueProps() {
  return (
    <section
      aria-label="Por qué comprar en el catálogo JDH"
      className="bg-[var(--color-ink)] dark:bg-[var(--color-paper)]"
    >
      <Stagger
        staggerDelay={0.08}
        className="mx-auto grid w-full max-w-[var(--container-wide)] grid-cols-1 gap-4 px-4 py-[var(--space-16)] sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:gap-6 lg:py-[var(--space-24)]"
      >
        {VALUE_PROPS.map(({ icon: Icon, title, description }) => (
          <StaggerItem key={title} className="h-full">
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
