"use client"

import * as React from "react"
import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react"

import { cn } from "@/lib/utils"

import { AnnouncementBar } from "./announcement-bar"
import { AppHeader } from "./app-header"
import { ContactBar } from "./contact-bar"
import { MainNav } from "./main-nav"

/** Altura de la ContactBar (h-9). */
const BAR_HEIGHT = 36
/** Scroll necesario (px) para ocultar por completo la franja. */
const HIDE_DISTANCE = 48

/**
 * Chrome del catálogo, todo en UN sticky wrapper: barra de contacto (con el
 * aviso encima), header principal y menú.
 *
 * La franja de contacto NO se desplaza con la página: se muestra SOLO en el
 * límite superior (scrollY ≈ 0). En lugar de un toggle binario, la franja
 * está ligada al scroll de forma CONTINUA (scroll-driven): su altura es una
 * función directa de `scrollY` (1 en el tope → 0 tras 48px), de modo que al
 * acercarte al tope la barra crece en sincronía exacta con el
 * desplazamiento. Como Lenis suaviza los valores de scroll, el
 * despliegue/colapso hereda esa misma suavidad — sin transiciones discretas
 * ni saltos: la barra "respira" con el scroll.
 *
 * `motion` aplica los estilos por frame vía rAF sin re-render de React
 * (solo el estado `hidden` para a11y cambia por umbral). Bajo
 * `prefers-reduced-motion` se degrada a un toggle binario sin animación
 * (presente en el tope, ausente al scrollear). `aria-hidden`/`inert` solo
 * cuando la franja está oculta.
 */
export function CatalogoChrome() {
  const reduce = useReducedMotion()
  const { scrollY } = useScroll()
  // 1 en el tope → 0 al alejarse HIDE_DISTANCE px (valores suavizados por Lenis).
  const progress = useTransform(scrollY, [0, HIDE_DISTANCE], [1, 0])
  const height = useTransform(progress, [1, 0], [BAR_HEIGHT, 0])
  const opacity = useTransform(progress, [0.6, 1], [0, 1])

  const [hidden, setHidden] = React.useState(false)
  useMotionValueEvent(progress, "change", (value) => {
    setHidden(value <= 0.05)
  })

  if (reduce) {
    return (
      <div className="sticky top-0 z-[var(--z-sticky)]">
        <div
          aria-hidden={hidden}
          inert={hidden}
          className={cn("overflow-hidden", hidden ? "h-0" : "h-9")}
        >
          <AnnouncementBar />
          <ContactBar />
        </div>
        <AppHeader />
        <MainNav />
      </div>
    )
  }

  return (
    <div className="sticky top-0 z-[var(--z-sticky)]">
      <motion.div
        aria-hidden={hidden}
        inert={hidden}
        style={{ height, opacity }}
        className="overflow-hidden"
      >
        <AnnouncementBar />
        <ContactBar />
      </motion.div>
      <AppHeader />
      <MainNav />
    </div>
  )
}
