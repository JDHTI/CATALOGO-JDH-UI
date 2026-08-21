"use client"

import * as React from "react"
import { motion, useReducedMotion } from "motion/react"

import type { Proveedor } from "../types"
import { iniciales } from "./iniciales"

/**
 * Cinta INFINITA de proveedores ("marquee") con desplazamiento FLUIDO y
 * continuo: el contenido se duplica una vez y se traduce con una animación
 * CSS/JS de bucle sin saltos (loop seamless), pausando al hover. Cada
 * proveedor = logo (monograma) + nombre y descripción AL FRENTE (en fila,
 * no columna). Sección NEGRA full-width (abarca todo el ancho de la
 * pantalla) y SIN divisor entre el título de la sección y el carrusel —
 * ambos viven en la misma franja negra.
 *
 * La traducción usa el propio contenido (2 copias) para un bucle perfecto;
 * con `useReducedMotion` se detiene en la primera copia.
 */
export function ProviderMarquee({ proveedores }: { proveedores: Proveedor[] }) {
  const reduce = useReducedMotion()
  // Se duplica la lista para que el bucle sea seamless: al llegar al final de
  // la primera copia, la segunda ocupa exactamente el mismo lugar.
  const items = [...proveedores, ...proveedores]
  // Segundos por vuelta completa de UNA copia — la velocidad se siente fluida.
  const duration = proveedores.length * 6

  return (
    <section
      aria-label="Proveedores aliados"
      className="overflow-hidden bg-[var(--color-ink)] text-[var(--color-on-ink)]"
    >
      <div className="mx-auto max-w-[var(--container-wide)] px-4 py-[var(--space-16)] sm:px-6 lg:py-[var(--space-24)]">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-2">
            <p className="font-mono text-xs tracking-[0.08em] text-[var(--color-on-ink-muted)] uppercase">
              Aliados de confianza
            </p>
            <h2
              id="proveedores-title"
              className="text-2xl font-bold tracking-tight text-balance text-[var(--color-on-ink)] sm:text-3xl"
            >
              Proveedores que respaldan cada pedido
            </h2>
          </div>

          <div
            className="relative overflow-hidden"
            // Máscara de desvanecimiento en los bordes para que la cinta
            // "entre y salga" de la sección (pureza del bucle infinito).
            style={{
              maskImage:
                "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
              WebkitMaskImage:
                "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
            }}
          >
            <motion.div
              className="flex w-max items-stretch gap-6"
              animate={reduce ? undefined : { x: ["0%", `-50%`] }}
              transition={
                reduce
                  ? undefined
                  : {
                      duration,
                      ease: "linear",
                      repeat: Infinity,
                    }
              }
            >
              {items.map((proveedor, index) => (
                <div
                  key={`${proveedor.id}-${index}`}
                  className="flex w-[22rem] shrink-0 items-center gap-4"
                >
                  <span
                    aria-hidden="true"
                    className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[var(--overlay-on-dark-08)] text-base font-bold text-[var(--color-on-ink)]"
                  >
                    {iniciales(proveedor.nombre)}
                  </span>
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <h3 className="truncate text-base font-medium text-[var(--color-on-ink)]">
                      {proveedor.nombre}
                    </h3>
                    <p className="line-clamp-2 text-sm text-[var(--color-on-ink-muted)]">
                      {proveedor.descripcion}
                    </p>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}
