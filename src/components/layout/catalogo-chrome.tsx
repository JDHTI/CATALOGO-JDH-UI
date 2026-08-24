"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
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
 * El bloque aviso + contacto es EXCLUSIVO del homepage y NUNCA se muestra en
 * mobile: es contenido promocional/de marca, no navegación esencial, y en
 * pantallas internas o angostas compite por espacio con lo que sí importa
 * (buscador, menú). `isHome` lo quita del árbol fuera de `/`; `hidden md:block`
 * lo quita visualmente bajo `md` sin desmontar los motion values.
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
 *
 * `--catalogo-chrome-height` (que el hero resta de `100svh`, ver
 * `hero-section.tsx`) NO se calcula a mano por breakpoint en `globals.css`
 * — cualquier cambio de padding/tamaño en `AppHeader` o `MainNav` desincroniza
 * ese número a mano y el resultado es un chrome que tapa el propio contenido
 * que dice restar. En su lugar, un `ResizeObserver` mide el alto REAL de
 * `AppHeader` + `MainNav` (la parte que no se anima con el scroll) y fija la
 * variable en `:root` con ese valor + `BAR_HEIGHT` cuando el bloque
 * aviso/contacto es visible (home Y `md`+) — la única condición en la que
 * realmente ocupa espacio en el tope. Un listener de `matchMedia` recalcula
 * si el viewport cruza `md` en caliente. Los valores en `globals.css` quedan
 * solo como fallback antes de la primera medición (SSR / pre-hidratación).
 */
export function CatalogoChrome() {
  const reduce = useReducedMotion()
  const { scrollY } = useScroll()
  const pathname = usePathname()
  const isHome = pathname === "/"
  // 1 en el tope → 0 al alejarse HIDE_DISTANCE px (valores suavizados por Lenis).
  const progress = useTransform(scrollY, [0, HIDE_DISTANCE], [1, 0])
  const height = useTransform(progress, [1, 0], [BAR_HEIGHT, 0])
  const opacity = useTransform(progress, [0.6, 1], [0, 1])

  const [hidden, setHidden] = React.useState(false)
  useMotionValueEvent(progress, "change", (value) => {
    setHidden(value <= 0.05)
  })

  const staticRef = React.useRef<HTMLDivElement>(null)
  React.useEffect(() => {
    const node = staticRef.current
    if (!node) return

    const mql = window.matchMedia("(min-width: 48rem)") // md

    const updateChromeHeight = () => {
      const measured = node.getBoundingClientRect().height
      const barVisible = isHome && mql.matches
      document.documentElement.style.setProperty(
        "--catalogo-chrome-height",
        `${measured + (barVisible ? BAR_HEIGHT : 0)}px`
      )
    }

    updateChromeHeight()
    const observer = new ResizeObserver(updateChromeHeight)
    observer.observe(node)
    mql.addEventListener("change", updateChromeHeight)
    return () => {
      observer.disconnect()
      mql.removeEventListener("change", updateChromeHeight)
    }
  }, [isHome])

  const topBlock = isHome ? (
    reduce ? (
      <div
        aria-hidden={hidden}
        inert={hidden}
        className={cn(
          "hidden overflow-hidden md:block",
          hidden ? "h-0" : "h-9"
        )}
      >
        <AnnouncementBar />
        <ContactBar />
      </div>
    ) : (
      <motion.div
        aria-hidden={hidden}
        inert={hidden}
        style={{ height, opacity }}
        className="hidden overflow-hidden md:block"
      >
        <AnnouncementBar />
        <ContactBar />
      </motion.div>
    )
  ) : null

  return (
    <div className="sticky top-0 z-[var(--z-sticky)]">
      {topBlock}
      <div ref={staticRef}>
        <AppHeader />
        <MainNav />
      </div>
    </div>
  )
}
