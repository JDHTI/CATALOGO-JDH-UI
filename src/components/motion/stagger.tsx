"use client"

import * as React from "react"
import { motion, useReducedMotion } from "motion/react"

const EASE = [0.2, 0, 0, 1] as const

/**
 * Staggered container — animates its `StaggerItem` children in sequence WHEN
 * SCROLLED INTO VIEW (`whileInView`, una sola vez). Works with Lenis (native
 * scroll) and native scroll alike, so every homepage grid gets a fluid
 * entrance on scroll. Passthrough under reduced motion.
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
  if (reduce) return <div className={className}>{children}</div>

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.15 }}
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
