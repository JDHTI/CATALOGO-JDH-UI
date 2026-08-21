"use client"

import Image from "next/image"

import { ScrollReveal } from "@/components/motion/scroll-reveal"
import { Stagger, StaggerItem } from "@/components/motion/stagger"

import type { Marca } from "../types"

/**
 * Banner grande de MARCAS institucionales: grilla COMPLETA de SOLO logos
 * (sin descripción), 5 columnas × 6 filas = 30 marcas, con hairline-grid
 * (gap-px sobre borde). Cada celda blanca muestra el logo de la marca
 * centrado (object-contain, altura uniforme). Las marcas son diferentes de
 * los proveedores — son las marcas típicas del sector institucional
 * (Alpina, Zenú, Nestlé, Coca-Cola…).
 */
export function BrandsSection({ marcas }: { marcas: Marca[] }) {
  return (
    <section aria-labelledby="marcas-title" className="flex flex-col gap-8">
      <ScrollReveal>
        <div className="flex flex-col gap-2">
          <p className="font-mono text-xs tracking-[0.08em] text-muted-foreground uppercase">
            Las marcas que ya conoces
          </p>
          <h2
            id="marcas-title"
            className="text-2xl font-bold tracking-tight text-balance sm:text-3xl"
          >
            Marcas líderes del sector institucional
          </h2>
        </div>
      </ScrollReveal>

      <Stagger
        staggerDelay={0.03}
        className="grid grid-cols-2 gap-px overflow-hidden rounded-[var(--jdh-radius-md)] border border-[var(--color-border)] bg-[var(--color-border)] sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
      >
        {marcas.map((marca) => (
          <StaggerItem key={marca.id} className="h-full">
            <div className="flex h-full items-center justify-center bg-[var(--color-surface)] px-4 py-6">
              <Image
                src={marca.imagen}
                alt={marca.nombre}
                width={96}
                height={48}
                className="h-12 w-auto max-w-full object-contain"
              />
            </div>
          </StaggerItem>
        ))}
      </Stagger>
    </section>
  )
}
