"use client"

import type { Route } from "next"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  ClipboardList,
  Heart,
  House,
  ShoppingCart,
  UserRound,
} from "lucide-react"

import { cn } from "@/lib/utils"

const items = [
  { href: "/", label: "Inicio", icon: House },
  { href: "/listas", label: "Mis listas", icon: ClipboardList },
  { href: "/carrito", label: "Carrito", icon: ShoppingCart },
  { href: "/favoritos", label: "Favoritos", icon: Heart },
  { href: "/cuenta", label: "Perfil", icon: UserRound },
] satisfies { href: Route; label: string; icon: typeof House }[]

/** Accesos móviles estables; las rutas privadas gestionan el inicio de sesión. */
export function MobileBottomNav() {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Navegación inferior"
      className="fixed inset-x-0 bottom-0 z-[var(--z-sticky)] grid grid-cols-5 border-t border-border bg-background pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      {items.map((mod) => {
        const Icon = mod.icon
        const active =
          pathname === mod.href ||
          (mod.href !== "/" && pathname.startsWith(`${mod.href}/`))

        return (
          <Link
            key={mod.href}
            href={mod.href as Route}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex h-[55px] min-w-0 flex-col items-center justify-center gap-1 text-[0.6875rem] transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring",
              active ? "font-medium text-foreground" : "text-muted-foreground"
            )}
          >
            <Icon aria-hidden="true" className="size-[22px] shrink-0" />
            <span className="line-clamp-1 max-w-full px-1 text-center">
              {mod.label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
