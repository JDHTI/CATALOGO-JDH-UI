import type { Route } from "next"
import Link from "next/link"
import type { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

interface IconNavLinkProps {
  href: `/${string}`
  icon: LucideIcon
  label: string
  /** Contador mockeado (favoritos/carrito no tienen estado real todavía). */
  count?: number
  className?: string
}

/**
 * Botón-ícono de la segunda barra (favoritos, carrito): ícono + badge de
 * conteo opcional, sin fondo hasta el hover. `count` en 0 no dibuja el badge
 * — así queda visualmente "vacío" en vez de mostrar un cero engañoso.
 */
export function IconNavLink({
  href,
  icon: Icon,
  label,
  count = 0,
  className,
}: IconNavLinkProps) {
  return (
    <Link
      href={href as Route}
      aria-label={label}
      title={label}
      className={cn(
        "relative inline-flex size-9 items-center justify-center rounded-lg text-[var(--color-on-ink)] transition-colors hover:bg-[var(--overlay-on-dark-08)]",
        className
      )}
    >
      <Icon className="size-5" />
      {count > 0 ? (
        <span
          aria-hidden
          // Badge invertido (blanco sobre negro) a propósito: `bg-primary`
          // en tema claro suele mapear al mismo negro del chrome y el
          // contador se volvería invisible sobre esta barra.
          className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-[var(--color-on-ink)] text-[10px] font-medium text-[var(--color-ink)]"
        >
          {count > 9 ? "9+" : count}
        </span>
      ) : null}
    </Link>
  )
}
