"use client"

import Link from "next/link"
import { UserRound } from "lucide-react"

import { useCurrentUser } from "@/hooks/use-current-user"

import { UserMenu } from "./user-menu"

/**
 * Apartado de cuenta de la segunda barra. Con sesión, delega en `UserMenu`
 * (avatar + dropdown); sin sesión, un único enlace "Mi cuenta" a `/ingreso`
 * — mismo tratamiento visual que los íconos de Favoritos/Carrito (ícono +
 * etiqueta), no dos enlaces de texto separados de ingreso/registro.
 *
 * En móvil (<sm) el enlace es solo el ícono, cuadrado como `IconNavLink` —
 * el label queda para lectores de pantalla vía `aria-label`.
 */
export function AuthActions() {
  const { user, isPending } = useCurrentUser()

  if (isPending) {
    return (
      <div
        aria-hidden
        className="size-9 animate-pulse rounded-lg bg-[var(--overlay-on-dark-08)] sm:h-9 sm:w-28"
      />
    )
  }

  if (user) return <UserMenu />

  return (
    <Link
      href="/ingreso"
      aria-label="Mi cuenta"
      className="flex h-9 w-9 items-center justify-center gap-2 rounded-lg px-0 text-sm font-medium text-[var(--color-on-ink)] transition-colors hover:bg-[var(--overlay-on-dark-08)] sm:w-auto sm:justify-start sm:px-3"
    >
      <UserRound className="size-[18px]" />
      <span className="hidden sm:inline">Mi cuenta</span>
    </Link>
  )
}
