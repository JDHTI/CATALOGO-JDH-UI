"use client"

import * as React from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import type { Route } from "next"
import { motion, useReducedMotion } from "motion/react"

import { InitialsAvatar } from "@/components/common/initials-avatar"
import { Logo } from "@/components/common/logo"
import { useCurrentUser } from "@/hooks/use-current-user"

import { primerNombre } from "./nombre"
import { BIENVENIDA_PARAM } from "./redirect-to"

const EASE = [0.2, 0, 0, 1] as const // == --ease-standard
/** Tiempo que el saludo se queda quieto antes de abrir la cortina. */
const ESPERA_MS = 1400
/** Margen para que la sesión llegue antes de rendirse y abrir sin nombre. */
const ESPERA_SESION_MS = 2500

type Fase = "saludando" | "abriendo" | "fin"

/**
 * Cortina de bienvenida: la animación del salto de `/ingreso` al catálogo.
 *
 * Se dispara con `?bienvenida=1`, que es lo que ponen los formularios y el
 * `callbackURL` de Entra (ver `./redirect-to.ts`). Dos paneles de tinta cubren
 * el viewport, aparece el saludo con la foto de perfil, y tras una pausa el
 * saludo se desvanece y los paneles se retiran hacia arriba y hacia abajo
 * dejando ver el catálogo ya cargado debajo.
 *
 * El parámetro se retira de la URL con `router.replace` en el primer efecto —
 * antes de que termine la animación— para que no quede en el historial ni
 * vuelva a dispararse al recargar. Que se retire NO desmonta la cortina: la
 * decisión de mostrarla se toma una sola vez y se guarda en estado, porque
 * este componente vive en el layout y sobrevive a ese `replace`.
 *
 * `aria-hidden`: es cromo de transición, no contenido. Lo que de verdad hay
 * que anunciar —quién eres y qué precios estás viendo— lo dice `WelcomeBanner`,
 * que sí es texto real en el documento y sigue ahí después. Por eso bajo
 * `prefers-reduced-motion` esto no se degrada a una versión estática: se salta
 * entero, y el saludo lo da el banner.
 *
 * Si la sesión no resuelve (alguien pegó el parámetro a mano sin haber
 * entrado), la cortina se abre igual pasados `ESPERA_SESION_MS` en vez de
 * quedarse tapando la página para siempre.
 */
export function WelcomeCurtain() {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const router = useRouter()
  const reduce = useReducedMotion()
  const { user, isPending } = useCurrentUser()

  const pedida = searchParams.get(BIENVENIDA_PARAM) === "1"
  const [fase, setFase] = React.useState<Fase>("fin")
  const yaDisparada = React.useRef(false)

  // Arranque: una sola vez por aparición del parámetro.
  React.useEffect(() => {
    if (!pedida || yaDisparada.current) return
    yaDisparada.current = true

    // Limpiar la URL de inmediato, no al final: si el usuario recarga a mitad
    // de la animación, no debe volver a verla.
    const restantes = new URLSearchParams(searchParams)
    restantes.delete(BIENVENIDA_PARAM)
    const consulta = restantes.toString()
    router.replace((consulta ? `${pathname}?${consulta}` : pathname) as Route, {
      scroll: false,
    })

    if (reduce) return
    // En el siguiente frame y no aquí mismo: un `setState` síncrono en el
    // cuerpo de un efecto encadena un render extra (regla
    // `react-hooks/set-state-in-effect`). Para una animación, empezar un frame
    // después es exactamente igual de correcto.
    const inicio = requestAnimationFrame(() => setFase("saludando"))
    return () => cancelAnimationFrame(inicio)
  }, [pedida, reduce, router, pathname, searchParams])

  // Pausa antes de abrir. Con sesión ya resuelta se cuenta `ESPERA_MS`; sin
  // ella se espera un poco más por si llega, pero nunca indefinidamente.
  React.useEffect(() => {
    if (fase !== "saludando") return
    const espera = isPending ? ESPERA_SESION_MS : ESPERA_MS
    const id = setTimeout(() => setFase("abriendo"), espera)
    return () => clearTimeout(id)
  }, [fase, isPending])

  if (fase === "fin") return null

  const abriendo = fase === "abriendo"
  const saludo = user ? `Bienvenido, ${primerNombre(user.name)}` : "Bienvenido"

  return (
    // Sin `pointer-events` explícito: los paneles cubren el viewport y se
    // llevan los clics mientras están, que es justo lo que queremos.
    <div
      aria-hidden
      className="fixed inset-0 z-[var(--z-overlay)] overflow-hidden"
    >
      <motion.div
        className="absolute inset-x-0 top-0 h-1/2 bg-[var(--color-ink)]"
        initial={{ y: 0 }}
        animate={{ y: abriendo ? "-100%" : 0 }}
        transition={{ duration: 0.7, ease: EASE }}
        // El desmontaje cuelga de ESTE panel y no de un temporizador: si el
        // navegador alarga la animación (pestaña en segundo plano, motion
        // reducido a mitad de camino), la cortina se va cuando de verdad
        // terminó de salir, nunca antes.
        onAnimationComplete={() => {
          if (abriendo) setFase("fin")
        }}
      />
      <motion.div
        className="absolute inset-x-0 bottom-0 h-1/2 bg-[var(--color-ink)]"
        initial={{ y: 0 }}
        animate={{ y: abriendo ? "100%" : 0 }}
        transition={{ duration: 0.7, ease: EASE }}
      />

      <motion.div
        className="absolute inset-0 flex flex-col items-center justify-center gap-8 px-6 text-[var(--color-on-ink)]"
        initial={{ opacity: 0, y: 12 }}
        animate={abriendo ? { opacity: 0, y: -8 } : { opacity: 1, y: 0 }}
        transition={{
          duration: abriendo ? 0.25 : 0.5,
          ease: EASE,
          delay: abriendo ? 0 : 0.12,
        }}
      >
        <Logo variant="lockup" tone="white" height={26} />

        <div className="flex flex-col items-center gap-4">
          {user ? (
            <InitialsAvatar
              name={user.name}
              src={user.image ?? undefined}
              size="lg"
              tone="on-ink"
            />
          ) : null}

          <p className="text-center text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
            {saludo}
          </p>
          <p className="font-mono text-xs tracking-[0.08em] text-[var(--color-on-ink-muted)] uppercase">
            Catálogo Juan D. Hoyos
          </p>
        </div>
      </motion.div>
    </div>
  )
}
