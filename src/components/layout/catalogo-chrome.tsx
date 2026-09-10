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

/**
 * Altura TOTAL de la ContactBar: su fila de `h-9` (36px) MÁS el hairline de
 * 1px con el que se separa del header (`border-b border-[--color-ink-border]`,
 * el mismo divisor que usa `AppHeader` para separar el menú).
 *
 * El +1 no es cosmético: este valor es el tope de la animación de altura, y el
 * contenedor lleva `overflow-hidden`. Con 36 el borde inferior quedaba
 * recortado justo cuando la franja está desplegada. También entra en
 * `--catalogo-chrome-height`, que el hero resta de `100svh`.
 */
const BAR_HEIGHT = 37
/** Scroll necesario (px) para ocultar por completo la franja. */
const HIDE_DISTANCE = 48
/** Breakpoint `md` de Tailwind, el mismo en el que aparece la franja. */
const MD = "(min-width: 48rem)"

/**
 * Chrome del catálogo, todo en UN sticky wrapper: barra de contacto (con el
 * aviso encima), header principal y menú.
 *
 * El bloque aviso + contacto NO se muestra en móvil (`hidden md:block`): son
 * datos de contacto y contenido promocional, no navegación esencial, y bajo
 * `md` compiten por altura con lo que sí importa en el tope de la pantalla
 * (el buscador y el menú). Teléfono, correo, WhatsApp e Instagram siguen
 * accesibles desde el footer. Se oculta con CSS y no desmontando el bloque
 * para no tirar los motion values al cruzar el breakpoint.
 *
 * La franja de contacto tampoco se desplaza con la página: se muestra SOLO en
 * el límite superior (scrollY ≈ 0). En lugar de un toggle binario, la franja
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
 * `hero-section.tsx`) NO se calcula a mano por breakpoint en `globals.css`:
 * el header pasa de dos filas en móvil a una sola desde `lg`, y la franja de
 * contacto solo existe desde `md` — cualquier número escrito a mano se
 * desincroniza con el primer cambio de padding y el resultado es un chrome
 * que tapa el contenido que dice restar. En su lugar, un `ResizeObserver`
 * mide el alto REAL de `AppHeader` + `MainNav` (la parte que no se anima con
 * el scroll) y fija la variable en `:root` con ese valor, más `BAR_HEIGHT`
 * solo cuando el bloque aviso/contacto de verdad ocupa espacio (`md`+). Un
 * listener de `matchMedia` recalcula si el viewport cruza `md` en caliente.
 * El valor de `globals.css` queda solo como fallback antes de la primera
 * medición (SSR / pre-hidratación).
 */
export function CatalogoChrome() {
  const reduce = useReducedMotion()
  const { scrollY } = useScroll()
  /**
   * La franja de contacto vive SOLO en la homepage. En el resto del catálogo
   * es una fila de datos que no ayuda a nadie a comprar: roba 37px del tope
   * en todas las páginas y compite con el buscador y el menú, que sí son
   * navegación. Teléfono, correo, WhatsApp e Instagram siguen en el footer, y
   * en la homepage —donde el visitante llega a orientarse— se conserva.
   */
  const esHome = usePathname() === "/"
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

    const mql = window.matchMedia(MD)

    const updateChromeHeight = () => {
      const medido = node.getBoundingClientRect().height
      // `BAR_HEIGHT` solo cuando la franja EXISTE de verdad: desde `md` y solo
      // en la homepage. Sumarlo fuera de ahí inflaría la variable en 37px y la
      // ficha de producto —que calcula su alto como `100svh` menos esto— se
      // quedaría corta, dejando un hueco muerto al pie.
      const conFranja = mql.matches && esHome
      document.documentElement.style.setProperty(
        "--catalogo-chrome-height",
        `${medido + (conFranja ? BAR_HEIGHT : 0)}px`
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
  }, [esHome])

  const bloqueSuperior = reduce ? (
    <div
      aria-hidden={hidden}
      inert={hidden}
      className={cn(
        "hidden overflow-hidden md:block",
        // `h-[37px]` y no `h-9`: mismo +1px del hairline que BAR_HEIGHT.
        hidden ? "h-0" : "h-[37px]"
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

  return (
    <div className="sticky top-0 z-[var(--z-sticky)]">
      {esHome ? bloqueSuperior : null}
      <div ref={staticRef}>
        <AppHeader />
        <MainNav />
      </div>
    </div>
  )
}
