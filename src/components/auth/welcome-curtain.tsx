"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
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
/** Duración de la retirada de los paneles (y del fundido con motion reducido). */
const SALIDA_S = 0.7
const SALIDA_REDUCIDA_S = 0.35

type Fase = "saludando" | "abriendo" | "fin"

/**
 * Cortina de bienvenida: la animación del salto de `/ingreso` al catálogo.
 *
 * Se dispara con `?bienvenida=1`, que es lo que ponen los formularios y el
 * `callbackURL` de Entra (ver `./redirect-to.ts`). Dos paneles BLANCOS cubren
 * el viewport, aparece el saludo con la foto de perfil, y tras una pausa el
 * saludo se desvanece y los paneles se retiran hacia arriba y hacia abajo
 * dejando ver el catálogo ya cargado debajo.
 *
 * **Blanca en los dos temas**, con los tokens `--color-paper*` — los mismos que
 * usan la nav principal, el footer y el menú de perfil para superficies que no
 * siguen al tema. Antes era tinta; el logo va en su variante negra y el avatar
 * en tono `on-paper` por la misma razón.
 *
 * El parámetro se lee de `window.location` y se retira al TERMINAR la
 * animación. El orden importa: hacerlo al arrancar es lo que impedía que la
 * cortina se pintara — ver el comentario del efecto de arranque.
 *
 * `aria-hidden`: es cromo de transición, no contenido. Lo que de verdad hay
 * que anunciar —quién eres y qué precios estás viendo— lo dice `WelcomeBanner`,
 * que sí es texto real en el documento y sigue ahí después.
 *
 * Bajo `prefers-reduced-motion` la cortina SÍ sale, pero sin desplazamiento:
 * los paneles se funden en vez de deslizarse. Antes se saltaba entera, y eso
 * dejaba sin bienvenida a quien tuviera esa preferencia activada — la
 * indicación pide quitar el MOVIMIENTO, no el contenido, y un fundido es la
 * acomodación estándar.
 *
 * Si la sesión no resuelve (alguien pegó el parámetro a mano sin haber
 * entrado), la cortina se abre igual pasados `ESPERA_SESION_MS` en vez de
 * quedarse tapando la página para siempre.
 */
export function WelcomeCurtain() {
  const pathname = usePathname()
  const reduce = useReducedMotion()
  const { user, isPending } = useCurrentUser()

  const [fase, setFase] = React.useState<Fase>("fin")

  /**
   * Quita `?bienvenida=1` de la URL al TERMINAR la animación.
   *
   * `history.replaceState` y no `router.replace`: es un retoque cosmético de
   * la barra de direcciones, no una navegación, y Next lo documenta justo para
   * este caso. Pasar por el router provocaría un render del árbol a mitad de
   * la animación sin ganar nada.
   *
   * Se limpia al final y no al arrancar para no interferir con la animación en
   * curso. El precio es que recargar durante los ~2 s que dura la repite —
   * ventana mínima y, de hecho, repetir una bienvenida interrumpida es lo
   * razonable.
   */
  const limpiarUrl = React.useCallback(() => {
    const url = new URL(window.location.href)
    if (!url.searchParams.has(BIENVENIDA_PARAM)) return
    url.searchParams.delete(BIENVENIDA_PARAM)
    window.history.replaceState(null, "", url.pathname + url.search + url.hash)
  }, [])

  /**
   * Arranque.
   *
   * **Aquí estaba el fallo por el que la cortina no salía NUNCA.** La versión
   * anterior leía el parámetro con `useSearchParams()` y limpiaba la URL con
   * `router.replace` dentro de este mismo efecto, con `searchParams` entre las
   * dependencias. La secuencia se saboteaba sola: `replace` cambia la URL →
   * `searchParams` es otro objeto → React re-ejecuta el efecto → y antes de
   * eso corre la LIMPIEZA del anterior, que hacía `cancelAnimationFrame` del
   * frame que iba a poner la fase en "saludando". Como el guard
   * `yaDisparada` ya estaba marcado, la reejecución salía por la puerta de
   * atrás y no reprogramaba nada. La animación se cancelaba antes de pintarse.
   *
   * Ahora el parámetro se lee de `window.location` y la limpieza ocurre al
   * TERMINAR (ver `limpiarUrl`), así que nada puede cancelar el arranque.
   * Leerlo de `location` en vez de `useSearchParams()` tiene además la ventaja
   * de no arrastrar un `Suspense` en el layout, que era la otra pieza que este
   * componente obligaba a mantener.
   *
   * La dependencia es `pathname`: es seguro en rutas estáticas y cambia en
   * cada ingreso (siempre se viene de `/ingreso`), así que el efecto vuelve a
   * correr en CADA inicio de sesión, no solo en el primero de la pestaña.
   */
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get(BIENVENIDA_PARAM) !== "1") return

    // En el siguiente frame y no aquí mismo: un `setState` síncrono en el
    // cuerpo de un efecto encadena un render extra (regla
    // `react-hooks/set-state-in-effect`). Para una animación, empezar un frame
    // después es exactamente igual de correcto.
    const inicio = requestAnimationFrame(() => setFase("saludando"))
    return () => cancelAnimationFrame(inicio)
  }, [pathname])

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
  const duracionSalida = reduce ? SALIDA_REDUCIDA_S : SALIDA_S

  /** Con motion reducido los paneles se funden; si no, se retiran deslizando. */
  const salida = (direccion: "arriba" | "abajo") => {
    if (reduce) return { opacity: abriendo ? 0 : 1, y: 0 }
    return {
      opacity: 1,
      y: abriendo ? (direccion === "arriba" ? "-100%" : "100%") : 0,
    }
  }

  return (
    // Sin `pointer-events` explícito: los paneles cubren el viewport y se
    // llevan los clics mientras están, que es justo lo que queremos.
    <div
      aria-hidden
      data-slot="welcome-curtain"
      className="fixed inset-0 z-[var(--z-overlay)] overflow-hidden"
    >
      <motion.div
        className="absolute inset-x-0 top-0 h-1/2 bg-[var(--color-paper)]"
        initial={{ y: 0, opacity: 1 }}
        animate={salida("arriba")}
        transition={{ duration: duracionSalida, ease: EASE }}
        // El desmontaje cuelga de ESTE panel y no de un temporizador: si el
        // navegador alarga la animación (pestaña en segundo plano), la cortina
        // se va cuando de verdad terminó de salir, nunca antes. Aquí también
        // se limpia la URL — ver `limpiarUrl` para por qué no puede hacerse
        // al arrancar.
        onAnimationComplete={() => {
          if (!abriendo) return
          setFase("fin")
          limpiarUrl()
        }}
      />
      <motion.div
        className="absolute inset-x-0 bottom-0 h-1/2 bg-[var(--color-paper)]"
        initial={{ y: 0, opacity: 1 }}
        animate={salida("abajo")}
        transition={{ duration: duracionSalida, ease: EASE }}
      />

      <motion.div
        className="absolute inset-0 flex flex-col items-center justify-center gap-8 px-6 text-[var(--color-on-paper)]"
        initial={{ opacity: 0, y: reduce ? 0 : 12 }}
        animate={
          abriendo ? { opacity: 0, y: reduce ? 0 : -8 } : { opacity: 1, y: 0 }
        }
        transition={{
          duration: abriendo ? 0.25 : 0.5,
          ease: EASE,
          delay: abriendo ? 0 : 0.12,
        }}
      >
        <Logo variant="lockup" tone="black" height={26} />

        <div className="flex flex-col items-center gap-4">
          {user ? (
            <InitialsAvatar
              name={user.name}
              src={user.image ?? undefined}
              size="lg"
              tone="on-paper"
            />
          ) : null}

          <p className="text-center text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
            {saludo}
          </p>
          <p className="font-mono text-xs tracking-[0.08em] text-[var(--color-on-paper-muted)] uppercase">
            Catálogo Juan D. Hoyos
          </p>
        </div>
      </motion.div>
    </div>
  )
}
