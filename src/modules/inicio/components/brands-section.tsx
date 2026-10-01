"use client"

import Image from "next/image"
import { useRef, useState, useSyncExternalStore } from "react"
import {
  AnimatePresence,
  motion,
  useInView,
  useReducedMotion,
} from "motion/react"

import { ScrollReveal } from "@/components/motion/scroll-reveal"

import { usePestanaVisible, useTablero } from "../hooks/use-tablero"
import type { LogoMarca } from "../types"

import { SECTION_EMPTY_COPY, SectionNota } from "./section-empty"

/**
 * Celdas por breakpoint: siempre CUATRO filas — 3 columnas en móvil (12), 4
 * desde `sm` (16) y 5 desde `lg` (20). Se renderizan siempre las 20 y el CSS
 * oculta las que sobran, así el HTML del servidor ya tiene la forma correcta
 * en cualquier ancho; JS solo necesita el número para no rotar celdas ocultas.
 */
const CELDAS_MAX = 20
const CONSULTAS: readonly [string, number][] = [
  ["(min-width: 1024px)", 20],
  ["(min-width: 640px)", 16],
]
const CELDAS_MOVIL = 12

function suscribirAncho(avisar: () => void) {
  const listas = CONSULTAS.map(([q]) => window.matchMedia(q))
  listas.forEach((l) => l.addEventListener("change", avisar))
  return () => listas.forEach((l) => l.removeEventListener("change", avisar))
}

function celdasDelAncho() {
  return (
    CONSULTAS.find(([q]) => window.matchMedia(q).matches)?.[1] ?? CELDAS_MOVIL
  )
}

/** Cada 3 s se cambian 2–3 celdas, con 150 ms entre una y otra. */
const INTERVALO_MS = 3000
const CELDAS_POR_TICK = [2, 3] as const
const DESFASE_MS = 150

const CLASES_GRILLA =
  "grid grid-cols-3 overflow-hidden rounded-[var(--jdh-radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] sm:grid-cols-4 lg:grid-cols-5"
/**
 * Hairline-grid con sombras en vez de bordes: cada celda pinta su línea
 * derecha e inferior, y el `overflow-hidden` del contenedor recorta las del
 * borde exterior. Las de la última fila/columna caen sobre el borde del
 * contenedor y no se notan.
 */
const CLASES_CELDA =
  "relative aspect-[4/3] shadow-[1px_0_0_0_var(--color-border),0_1px_0_0_var(--color-border)] max-sm:nth-[n+13]:hidden sm:aspect-[3/2] sm:max-lg:nth-[n+17]:hidden lg:aspect-[2/1]"
/**
 * El logo se ajusta por ALTO (lienzo cuadrado en una celda apaisada), así que
 * el ancho real que pinta es el alto de la celda, no su ancho.
 */
const SIZES_LOGO = "(min-width: 1024px) 160px, (min-width: 640px) 140px, 100px"
/** Logos de la cola que se descargan antes de su turno: un tick completo. */
const PRECARGA = CELDAS_POR_TICK[1]

/**
 * Tablero de LOGOS de marca: cuatro filas de celdas que se apagan y encienden
 * de forma escalonada, recorriendo todo el pool del manifiesto del bucket
 * (`brands/manifest.json`, leído en servidor — ver `listarLogosMarcas`).
 *
 * - Sin texto por celda: solo el logo, con el nombre derivado del slug como
 *   `alt`. Los logos NO enlazan: el manifiesto no trae el id de marca del
 *   catálogo, y un blanco que cambia bajo el cursor es un mal enlace.
 * - Nunca hay dos celdas con el mismo logo y con el tiempo pasan todos — ver
 *   `useTablero`.
 * - La rotación se detiene con `prefers-reduced-motion`, con la pestaña en
 *   segundo plano y con la sección fuera de vista.
 * - Los logos vienen en gris oscuro sobre transparente. En tema oscuro se
 *   invierten a gris claro, con algo de opacidad para que los de formas
 *   sólidas no deslumbren.
 *
 * Sin manifiesto (bucket sin configurar, error de red) se dibuja la grilla
 * fantasma con la nota de siempre; nunca una grilla de imágenes rotas.
 */
export function BrandsSection({ marcas }: { marcas: LogoMarca[] | null }) {
  const lista = marcas ?? []

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
            Marcas del portafolio institucional
          </h2>
        </div>
      </ScrollReveal>

      {lista.length > 0 ? (
        <Tablero marcas={lista} />
      ) : (
        <div className="flex flex-col gap-4">
          <div className={CLASES_GRILLA} aria-hidden="true">
            {Array.from({ length: CELDAS_MAX }, (_, i) => (
              <div key={i} className={CLASES_CELDA} />
            ))}
          </div>
          <SectionNota
            mensaje={
              marcas === null
                ? SECTION_EMPTY_COPY.error
                : SECTION_EMPTY_COPY.sinDatos("logos de marca")
            }
          />
        </div>
      )}
    </section>
  )
}

const slugDe = (marca: LogoMarca) => marca.slug

function Tablero({ marcas }: { marcas: LogoMarca[] }) {
  const ref = useRef<HTMLUListElement>(null)
  const enVista = useInView(ref, { amount: 0.25 })
  const pestanaVisible = usePestanaVisible()
  const reducir = useReducedMotion() ?? false
  const visibles = useSyncExternalStore(
    suscribirAncho,
    celdasDelAncho,
    () => CELDAS_MAX
  )

  const orden = useTablero(marcas, slugDe, {
    visibles,
    activo: enVista && pestanaVisible && !reducir,
    intervaloMs: INTERVALO_MS,
    celdasPorTick: CELDAS_POR_TICK,
    desfaseMs: DESFASE_MS,
  })

  return (
    <>
      <ul ref={ref} className={CLASES_GRILLA}>
        {orden.slice(0, CELDAS_MAX).map((marca, celda) => (
          // La celda es la identidad estable; el logo dentro es lo que cambia.
          <li key={celda} className={CLASES_CELDA}>
            <AnimatePresence mode="wait" initial={false}>
              <LogoCelda key={marca.slug} marca={marca} reducir={reducir} />
            </AnimatePresence>
          </li>
        ))}
      </ul>
      {/* Los siguientes de la cola, con el mismo `sizes` para que el navegador
          pida la misma variante y la tenga en caché cuando les toque. */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed size-px opacity-0"
      >
        {orden.slice(visibles, visibles + PRECARGA).map((marca) => (
          <Image
            key={marca.slug}
            src={marca.logo}
            alt=""
            fill
            loading="eager"
            sizes={SIZES_LOGO}
          />
        ))}
      </div>
    </>
  )
}

/**
 * Un logo dentro de su celda. Se enciende al CARGAR, no al montarse: si no, un
 * logo que entra por rotación se fundiría como un hueco vacío y aparecería de
 * golpe después.
 */
function LogoCelda({ marca, reducir }: { marca: LogoMarca; reducir: boolean }) {
  const [cargado, setCargado] = useState(false)
  const visible = { opacity: 1, scale: 1 }
  const apagado = { opacity: 0, scale: 0.94 }

  return (
    <motion.div
      className="absolute inset-0 p-2 sm:p-3"
      initial={apagado}
      animate={cargado ? visible : apagado}
      exit={apagado}
      transition={{ duration: reducir ? 0 : 0.35, ease: "easeOut" }}
    >
      <div className="relative size-full">
        <Image
          src={marca.logo}
          alt={marca.nombre}
          fill
          sizes={SIZES_LOGO}
          onLoad={() => setCargado(true)}
          // `invert` a secas, no `brightness-0 invert`: aplanar a negro antes
          // de invertir convertía los logos de formas sólidas en manchas
          // blancas sin detalle interior.
          className="object-contain dark:opacity-90 dark:invert"
        />
      </div>
    </motion.div>
  )
}
