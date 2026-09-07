"use client"

import { usePathname } from "next/navigation"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { X } from "lucide-react"

import { InitialsAvatar } from "@/components/common/initials-avatar"
import { useCurrentUser } from "@/hooks/use-current-user"

import { primerNombre } from "./nombre"
import { useDescarteBienvenida } from "./use-descarte-bienvenida"

/**
 * Franja de bienvenida bajo el chrome, para visitantes CON sesión.
 *
 * Se monta dentro del bloque medido de `CatalogoChrome` a propósito, y no
 * suelto encima de `<main>`. El primer slide de la portada mide
 * `100svh - var(--catalogo-chrome-height)`, y esa variable la fija un
 * `ResizeObserver` sobre ese bloque: metiendo la franja ahí, aparecer y
 * descartarse recalculan la altura del hero solos, sin sumar un número a mano
 * en `globals.css` ni dejar el hero desbordando la primera pantalla.
 *
 * Solo en la portada (`/`). Es un saludo de llegada, no un elemento de
 * navegación: acompañarlo por todo el sitio lo convertiría en ruido permanente.
 *
 * El descarte se guarda por usuario en `localStorage` vía
 * `useDescarteBienvenida`. Es preferencia de presentación, no un dato de
 * sesión — nada que ver con las cookies httpOnly donde vive la sesión, y sin
 * ningún token de por medio.
 *
 * En el HTML del servidor la franja no existe (no se puede saber si ya se
 * cerró), así que entra animando su propia altura: el hero se ajusta en el
 * mismo gesto en vez de dar un salto.
 */
export function WelcomeBanner() {
  const pathname = usePathname()
  const { user } = useCurrentUser()
  const reduce = useReducedMotion()
  const { descartada, descartar } = useDescarteBienvenida(user?.id ?? null)

  const visible = Boolean(user) && !descartada && pathname === "/"

  return (
    <AnimatePresence initial={false}>
      {visible && user ? (
        <motion.div
          key="bienvenida"
          initial={reduce ? false : { height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
          transition={{ duration: 0.32, ease: [0.2, 0, 0, 1] }}
          className="overflow-hidden border-b border-border bg-background"
        >
          <div className="mx-auto flex w-full max-w-[var(--container-wide)] items-center gap-3 px-[var(--gutter)] py-3">
            <InitialsAvatar
              name={user.name}
              src={user.image ?? undefined}
              size="sm"
            />

            <div className="flex min-w-0 flex-1 flex-col leading-tight sm:flex-row sm:items-baseline sm:gap-2">
              <p className="truncate text-sm font-medium text-foreground">
                Bienvenido, {primerNombre(user.name)}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {user.clienteId
                  ? "Estás viendo los precios de tu lista negociada."
                  : "Estás viendo los precios de lista pública."}
              </p>
            </div>

            <button
              type="button"
              onClick={descartar}
              aria-label="Ocultar el saludo de bienvenida"
              className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors outline-none hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="size-4" />
            </button>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
