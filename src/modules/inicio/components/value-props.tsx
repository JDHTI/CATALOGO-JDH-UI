"use client"

import { BadgeCheck, Headset, Tag, Truck, type LucideIcon } from "lucide-react"

import { Stagger, StaggerItem } from "@/components/motion/stagger"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel"

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
 * Sección de cobertura y precios de lista: FULL-BLEED NEGRA (`--color-ink`),
 * pegada al hero — el "spacer" entre la imagen del hero y la siguiente
 * sección es el propio negro de la página (en claro). Las 4 propuestas de
 * valor son CARDS INDEPENDIENTES (cada una con su borde hairline, separadas
 * por gap) con hover con overlay sutil.
 *
 * Superficies INVERSAS (--color-invert): en claro la sección es NEGRA con
 * texto blanco (como siempre); en oscuro se invierte a BLANCA con texto
 * negro — el contenido del homepage alterna con el tema, a diferencia del
 * chrome. El padding vertical es simétrico (--space-16 móvil / --space-24
 * desktop): el margen contra el hero arriba y contra la siguiente sección
 * abajo es el mismo.
 *
 * Bajo `lg` las 4 cards son un carrusel (arrastre táctil) en vez de apilarse
 * en columna — cuatro secciones completas de alto en un móvil de gama media
 * empujaban el resto del homepage muy abajo. El grid original se conserva
 * desde `lg`. El stagger de entrada solo corre en la rama de grid: sus
 * transforms compiten con el `overflow-hidden` de embla en la rama carrusel.
 */
function ValuePropCard({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon
  title: string
  description: string
}) {
  return (
    <div className="flex h-full flex-col gap-3 rounded-[var(--jdh-radius-md)] border border-[var(--color-invert-border)] bg-[var(--color-invert)] p-6 text-[var(--color-on-invert)] transition-colors duration-[var(--duration-fast)] hover:bg-[var(--color-invert-hover-bg)]">
      <span className="flex size-10 items-center justify-center rounded-[var(--jdh-radius-sm)] bg-[var(--color-invert-hover-bg)] text-[var(--color-on-invert)]">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <h2 className="text-base font-medium">{title}</h2>
      <p className="text-sm text-[var(--color-on-invert-muted)]">
        {description}
      </p>
    </div>
  )
}

export function ValueProps() {
  return (
    <section
      aria-label="Por qué comprar en el catálogo JDH"
      className="bg-[var(--color-invert)]"
    >
      <Carousel
        opts={{ align: "start" }}
        className="mx-auto w-full max-w-[var(--container-wide)] px-4 py-[var(--space-16)] sm:px-6 lg:hidden"
      >
        <CarouselContent className="items-stretch">
          {VALUE_PROPS.map((prop) => (
            <CarouselItem key={prop.title} className="basis-[85%] sm:basis-1/2">
              <ValuePropCard {...prop} />
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>

      <Stagger
        staggerDelay={0.08}
        className="mx-auto hidden w-full max-w-[var(--container-wide)] grid-cols-4 gap-6 px-6 py-[var(--space-24)] lg:grid"
      >
        {VALUE_PROPS.map((prop) => (
          <StaggerItem key={prop.title} className="h-full">
            <ValuePropCard {...prop} />
          </StaggerItem>
        ))}
      </Stagger>
    </section>
  )
}
