"use client"

import * as React from "react"
import { motion, useInView, useReducedMotion } from "motion/react"

const EASE = [0.2, 0, 0, 1] as const

/**
 * Staggered container — animates its `StaggerItem` children in sequence WHEN
 * SCROLLED INTO VIEW (una sola vez). Works with Lenis (native scroll) and
 * native scroll alike, so every homepage grid gets a fluid entrance on
 * scroll. Passthrough under reduced motion.
 *
 * El disparo va por `useInView` + `animate`, y NO por el gesto `whileInView`,
 * porque el contenido puede cambiar después de que la animación ya corrió
 * (el grid del catálogo remonta todos sus hijos al aplicar o limpiar un
 * filtro, porque las `key` son los ids de producto). Con el gesto, esos hijos
 * nuevos nacían en la variante `hidden` heredada del `initial` y se quedaban
 * en `opacity: 0` para siempre: el observer ya se había desconectado por
 * `once`, así que el padre nunca volvía a propagar `show`. Las variantes de
 * `animate` sí las heredan los hijos que se montan más tarde.
 */
export function Stagger({
  staggerDelay = 0.06,
  className,
  children,
}: {
  staggerDelay?: number
  className?: string
  children: React.ReactNode
}) {
  const reduce = useReducedMotion()
  const ref = React.useRef<HTMLDivElement>(null)
  const enVista = useInView(ref, { once: true, amount: 0.15 })

  if (reduce) return <div className={className}>{children}</div>

  return (
    <motion.div
      ref={ref}
      className={className}
      initial="hidden"
      animate={enVista ? "show" : "hidden"}
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: staggerDelay } },
      }}
    >
      {children}
    </motion.div>
  )
}

export function StaggerItem({
  y = 12,
  className,
  children,
}: {
  /** Rise distance in px. */
  y?: number
  className?: string
  children: React.ReactNode
}) {
  const reduce = useReducedMotion()
  if (reduce) return <div className={className}>{children}</div>

  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y },
        show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE } },
      }}
    >
      {children}
    </motion.div>
  )
}
