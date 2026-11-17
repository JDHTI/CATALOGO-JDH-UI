"use client"

import Link from "next/link"
import { ClipboardList } from "lucide-react"

import { Logo } from "@/components/common/logo"
import { ThemeSwitcher } from "@/components/common/theme-switcher"
import { CarritoNavLink } from "@/modules/carrito/components/carrito-nav-link"
import { FavoritosNavLink } from "@/modules/favoritos/components/favoritos-nav-link"

import { AuthActions } from "./auth-actions"
import { IconNavLink } from "./icon-nav-link"
import { ProductSearchBar } from "./product-search-bar"

/** Header adaptable; comparte las columnas con MainNav para alinear el buscador. */
export function AppHeader() {
  return (
    <header className="border-b border-[var(--color-ink-border)] bg-[var(--color-ink)] text-[var(--color-on-ink)]">
      <div className="mx-auto grid max-w-[var(--container-wide)] grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3 gap-y-3 px-4 py-3 sm:gap-x-4 sm:px-6 md:grid-cols-[minmax(0,1fr)_auto] lg:h-[72px] lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_22rem] lg:py-0">
        <Link
          href="/"
          aria-label="Ir al inicio"
          className="flex min-w-0 shrink-0 items-center justify-self-start [&_img]:max-w-full [&_img]:object-contain"
        >
          <Logo
            variant="mark"
            tone="white"
            height={32}
            priority
            className="md:hidden"
          />
          <Logo
            variant="lockup"
            tone="white"
            height={32}
            priority
            className="hidden md:inline-flex"
          />
        </Link>

        <ProductSearchBar className="w-full min-w-0 md:order-last md:col-span-2 lg:order-none lg:col-span-1 lg:max-w-2xl lg:min-w-0 lg:justify-self-center" />

        <div className="hidden min-w-0 shrink-0 items-center gap-1 justify-self-end md:flex">
          <div className="hidden items-center gap-1 md:flex">
            <FavoritosNavLink />
            <IconNavLink
              href="/listas"
              icon={ClipboardList}
              label="Mis listas"
            />
            <CarritoNavLink />
            <span
              aria-hidden
              className="mx-1 h-6 w-px bg-[var(--color-ink-border)]"
            />
          </div>
          <ThemeSwitcher variant="on-ink" />
          <div className="hidden md:block">
            <AuthActions />
          </div>
        </div>
      </div>
    </header>
  )
}
