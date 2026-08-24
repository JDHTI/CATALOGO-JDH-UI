"use client"

import type { Route } from "next"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { modules } from "@/config/modules"
import { useCurrentUser } from "@/hooks/use-current-user"
import { cn } from "@/lib/utils"

/**
 * Mobile bottom navigation: the first four visible `main` modules as
 * icon+label tabs. Hidden from `md` up (the horizontal `MainNav` takes over
 * there). `z-[var(--z-dropdown)]` (below `MainNav`'s `--z-sticky`) so the
 * mega menu panel — part of the sticky chrome's own stacking context — can
 * always paint above this fixed bar instead of being covered by it.
 */
export function MobileBottomNav() {
  const pathname = usePathname()
  const { permissions } = useCurrentUser()
  const visibleIds = new Set(
    modules.visibleTo(permissions).map((mod) => mod.id)
  )
  const items = modules
    .navItems("main")
    .filter((mod) => visibleIds.has(mod.id))
    .slice(0, 4)

  return (
    <nav
      aria-label="Navegación inferior"
      style={{
        gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))`,
      }}
      className="fixed inset-x-0 bottom-0 z-[var(--z-dropdown)] grid border-t border-border bg-background pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      {items.map((mod) => {
        const Icon = mod.icon
        const active =
          pathname === mod.href || pathname.startsWith(`${mod.href}/`)

        return (
          <Link
            key={mod.id}
            href={mod.href as Route}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex flex-col items-center gap-1 py-2 text-[0.6875rem] transition-colors",
              active ? "font-medium text-foreground" : "text-muted-foreground"
            )}
          >
            <Icon className="size-[22px] shrink-0" />
            <span className="line-clamp-1 max-w-full px-1 text-center">
              {mod.nav?.label ?? mod.title}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
