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
 * Propuesta de valor: 4 trust badges con iconos lucide en grid con borde
 * hairline, animados en stagger al montar.
 */
export function ValueProps() {
  return (
    <section aria-label="Por qué comprar en el catálogo JDH">
      <Stagger className="grid grid-cols-1 gap-px overflow-hidden rounded-[var(--jdh-radius-md)] border border-[var(--color-border)] bg-[var(--color-border)] sm:grid-cols-2 lg:grid-cols-4">
        {VALUE_PROPS.map(({ icon: Icon, title, description }) => (
          <StaggerItem key={title} className="h-full">
            <div className="flex h-full flex-col gap-3 bg-[var(--color-surface)] p-6">
              <span className="flex size-10 items-center justify-center rounded-[var(--jdh-radius-sm)] bg-[var(--color-surface-subtle)] text-foreground">
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <h2 className="text-base font-medium">{title}</h2>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
          </StaggerItem>
        ))}
      </Stagger>
    </section>
  )
}
