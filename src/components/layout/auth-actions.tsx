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
 */
export function AuthActions() {
  const { user, isPending } = useCurrentUser()

  if (isPending) {
    return (
      <div
        aria-hidden
        className="h-9 w-28 animate-pulse rounded-lg bg-[var(--overlay-on-dark-08)]"
      />
    )
  }

  if (user) return <UserMenu />

  return (
    <Link
      href="/ingreso"
      className="flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-medium text-[var(--color-on-ink)] transition-colors hover:bg-[var(--overlay-on-dark-08)]"
    >
      <UserRound className="size-[18px]" />
      Mi cuenta
    </Link>
  )
}
