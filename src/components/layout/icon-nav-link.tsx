import type { Route } from "next"
import Link from "next/link"
import type { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

/** A partir de aquí el badge muestra "99+" en vez del número exacto. */
const TOPE_BADGE = 99

interface IconNavLinkProps {
  href: `/${string}`
  icon: LucideIcon
  label: string
  /** Favoritos lo alimenta de verdad; carrito sigue sin estado. */
  count?: number
  className?: string
}

/**
 * Botón-ícono de la segunda barra (favoritos, carrito): ícono + badge de
 * conteo opcional, sin fondo hasta el hover. `count` en 0 no dibuja el badge
 * — así queda visualmente "vacío" en vez de mostrar un cero engañoso.
 *
 * El badge crece a lo ANCHO (`min-w-4` + `px-1`) en vez de tener lado fijo,
 * para que "99+" quepa sin recortarse. El ícono y el área táctil no cambian
 * de tamaño con el contador: el badge está posicionado en absoluto, así que
 * queda fuera del flujo y la barra no se mueve cuando el número crece.
 */
export function IconNavLink({
  href,
  icon: Icon,
  label,
  count = 0,
  className,
}: IconNavLinkProps) {
  // El badge es `aria-hidden` (es decoración de un dato que ya se anuncia),
  // así que el conteo tiene que viajar en la etiqueta o un lector de pantalla
  // nunca se entera de que hay algo guardado. Aquí va el número EXACTO, no
  // el "99+": el recorte es una restricción de espacio visual, no del dato.
  const etiqueta = count > 0 ? `${label} (${count})` : label

  return (
    <Link
      href={href as Route}
      aria-label={etiqueta}
      title={etiqueta}
      className={cn(
        "group/icon-link relative inline-flex size-9 items-center justify-center rounded-lg text-[var(--color-on-ink)] transition-colors hover:bg-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-on-ink)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-ink)]",
        className
      )}
    >
      <Icon
        className="size-5 transition-[transform,filter,color] duration-200 ease-out group-hover/icon-link:scale-[1.12] group-hover/icon-link:drop-shadow-[0_0_7px_var(--color-on-ink-muted)] group-focus-visible/icon-link:scale-[1.08] motion-reduce:transition-none motion-reduce:transform-none"
      />
      {count > 0 ? (
        <span
          aria-hidden
          // Badge invertido (blanco sobre negro) a propósito: `bg-primary`
          // en tema claro suele mapear al mismo negro del chrome y el
          // contador se volvería invisible sobre esta barra.
          className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--color-on-ink)] px-1 text-[10px] font-medium text-[var(--color-ink)] tabular-nums"
        >
          {count > TOPE_BADGE ? `${TOPE_BADGE}+` : count}
        </span>
      ) : null}
    </Link>
  )
}
