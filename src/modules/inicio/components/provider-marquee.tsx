"use client"

import { motion, useReducedMotion } from "motion/react"

import { formatNombreComercial, formatNumero } from "@/lib/format"
import { useProveedores } from "@/modules/catalogo/hooks/use-productos"

import {
  LogoComercial,
  LogoComercialVacio,
} from "@/modules/catalogo/components/logo-comercial"

import { SECTION_EMPTY_COPY, SectionNota } from "./section-empty"

/** Tope de proveedores en la cinta: con cientos, el bucle se vuelve eterno. */
const MAX_EN_CINTA = 20

/**
 * Cinta INFINITA de proveedores ("marquee") con desplazamiento FLUIDO y
 * continuo: el contenido se duplica una vez y se traduce con una animación
 * de bucle sin saltos (loop seamless), pausando con `prefers-reduced-motion`.
 * Cada proveedor = slot de LOGO (`LogoComercial`, hoy monograma hasta que el
 * backend envíe `logoUrl`) + nombre y su conteo de referencias AL FRENTE (en
 * fila, no columna). Sección NEGRA full-width y SIN divisor entre el título
 * y el carrusel — ambos viven en la misma franja negra.
 *
 * Los proveedores son REALES (`GET /suppliers`). Antes venían de un mock con
 * un `slogan` y una `descripcion` inventados por proveedor; el API solo da
 * nombre y conteo, así que la línea de apoyo es el conteo — un dato
 * verdadero en vez de una frase de relleno.
 *
 * La traducción usa el propio contenido (2 copias) para un bucle perfecto;
 * con `useReducedMotion` se detiene en la primera copia.
 *
 * Sin proveedores la FRANJA SE MANTIENE (es el ritmo visual de la página: un
 * bloque negro full-width entre dos bloques claros) y dibuja una fila
 * fantasma con los mismos slots de logo. Solo la animación desaparece — no
 * se puede animar un bucle de cero elementos.
 */
export function ProviderMarquee() {
  const reduce = useReducedMotion()
  const { data, isPending, isError } = useProveedores()

  const proveedores = (data ?? [])
    .slice()
    .sort((a, b) => (b.totalProductos ?? 0) - (a.totalProductos ?? 0))
    .slice(0, MAX_EN_CINTA)

  const sinCinta = !isPending && proveedores.length === 0

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

          {isError || sinCinta ? (
            // Cinta fantasma: misma fila de logos + texto, sin animar (no se
            // puede hacer un bucle de cero elementos). Mantiene la franja
            // negra con cuerpo en vez de dejar un bloque vacío.
            <div className="flex flex-col gap-6">
              <div className="flex gap-6 overflow-hidden" aria-hidden="true">
                {Array.from({ length: 6 }, (_, i) => (
                  <div
                    key={i}
                    className="flex w-[22rem] shrink-0 items-center gap-4"
                  >
                    <LogoComercialVacio
                      className="size-12 rounded-full"
                      onInk
                    />
                    <div className="flex min-w-0 flex-1 flex-col gap-2">
                      <span className="h-4 w-2/3 rounded bg-[var(--overlay-on-dark-08)]" />
                      <span className="h-3 w-1/3 rounded bg-[var(--overlay-on-dark-08)]" />
                    </div>
                  </div>
                ))}
              </div>
              <SectionNota
                mensaje={
                  isError
                    ? SECTION_EMPTY_COPY.error
                    : SECTION_EMPTY_COPY.sinDatos("proveedores")
                }
                onInk
              />
            </div>
          ) : (
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
                    {/* Mismo slot que la grilla: cuando el backend envíe
                        `logoUrl`, la cinta muestra logos sin más cambios. */}
                    <LogoComercial
                      nombre={proveedor.nombre}
                      logoUrl={proveedor.logoUrl}
                      sizes="48px"
                      onInk
                      className="size-12 rounded-full"
                    />
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <h3 className="truncate text-base font-medium text-[var(--color-on-ink)]">
                        {formatNombreComercial(proveedor.nombre)}
                      </h3>
                      {proveedor.totalProductos != null ? (
                        <p className="text-sm text-[var(--color-on-ink-muted)]">
                          {formatNumero(proveedor.totalProductos)}{" "}
                          {proveedor.totalProductos === 1
                            ? "referencia"
                            : "referencias"}
                        </p>
                      ) : null}
                    </div>
                  </div>
                ))}
              </motion.div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
