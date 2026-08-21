"use client"

import type { Route } from "next"
import Link from "next/link"
import { usePathname } from "next/navigation"
import type { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

export interface SidebarItem {
  href: `/${string}`
  label: string
  icon: LucideIcon
  /** Match the pathname exactly (default matches by prefix too). */
  exact?: boolean
}

export interface SidebarSection {
  id: string
  items: SidebarItem[]
  /** `bottom` pins the section to the foot of the sidebar (the "menú inferior"). */
  position?: "top" | "bottom"
}

export interface SidebarProps {
  brand: { label: string; href: `/${string}` }
  sections: SidebarSection[]
  className?: string
}

/**
 * Generic configurable sidebar (black chrome). Both `AppSidebar` (module
 * registry) and `AdminSidebar` (adminNav) are thin wrappers that feed it
 * sections. Client component: it renders `LucideIcon`s, which must not cross
 * the RSC boundary as props — wrappers import their source directly.
 */
export function Sidebar({ brand, sections, className }: SidebarProps) {
  const pathname = usePathname()

  const isActive = (item: SidebarItem) =>
    item.exact
      ? pathname === item.href
      : pathname === item.href || pathname.startsWith(`${item.href}/`)

  const renderSection = (section: SidebarSection) => (
    <nav key={section.id} className="flex flex-col gap-1">
      {section.items.map((item) => {
        const Icon = item.icon
        const active = isActive(item)

        return (
          <Link
            key={item.href}
            href={item.href as Route}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
              active && "bg-sidebar-accent text-sidebar-foreground"
            )}
          >
            <Icon className="size-4 shrink-0" />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )

  const topSections = sections.filter((s) => s.position !== "bottom")
  const bottomSections = sections.filter((s) => s.position === "bottom")

  return (
    <aside
      className={cn(
        "hidden w-64 shrink-0 flex-col gap-6 bg-sidebar px-4 py-6 text-sidebar-foreground md:flex",
        className
      )}
    >
      <Link
        href={brand.href as Route}
        className="px-3 text-lg font-bold tracking-tight"
      >
        {brand.label}
      </Link>

      {topSections.map(renderSection)}

      {bottomSections.length > 0 ? (
        <div className="mt-auto flex flex-col gap-6">
          {bottomSections.map(renderSection)}
        </div>
      ) : null}
    </aside>
  )
}
