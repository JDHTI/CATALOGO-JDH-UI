"use client"

import { ScrollReveal } from "@/components/motion/scroll-reveal"
import { Stagger, StaggerItem } from "@/components/motion/stagger"

import type { Proveedor } from "../types"

function iniciales(nombre: string): string {
  return nombre
    .split(" ")
    .filter((palabra) => palabra.length > 0)
    .slice(0, 2)
    .map((palabra) => palabra[0]!.toUpperCase())
    .join("")
}

/**
 * Grid de proveedores aliados: iniciales en superficie subtle + nombre +
 * descripción corta. Mismo tratamiento visual que el resto de cards.
 */
export function SuppliersSection({
  proveedores,
}: {
  proveedores: Proveedor[]
}) {
  return (
    <section
      aria-labelledby="proveedores-title"
      className="flex flex-col gap-8"
    >
      <ScrollReveal>
        <div className="flex flex-col gap-2">
          <p className="font-mono text-xs tracking-[0.08em] text-muted-foreground uppercase">
            Aliados de confianza
          </p>
          <h2
            id="proveedores-title"
            className="text-2xl font-bold tracking-tight text-balance sm:text-3xl"
          >
            Proveedores que respaldan cada pedido
          </h2>
        </div>
      </ScrollReveal>

      <Stagger className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {proveedores.map((proveedor) => (
          <StaggerItem key={proveedor.id} className="h-full">
            <div className="flex h-full items-start gap-4 rounded-[var(--jdh-radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 transition-[border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-[var(--color-border-strong)]">
              <span
                aria-hidden="true"
                className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[var(--color-surface-subtle)] text-sm font-medium text-foreground"
              >
                {iniciales(proveedor.nombre)}
              </span>
              <div className="flex flex-col gap-1">
                <h3 className="text-base font-medium">{proveedor.nombre}</h3>
                <p className="text-sm text-muted-foreground">
                  {proveedor.descripcion}
                </p>
              </div>
            </div>
          </StaggerItem>
        ))}
      </Stagger>
    </section>
  )
}
