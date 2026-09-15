"use client"

import Link from "next/link"
import { ClipboardList, ShoppingCart } from "lucide-react"

import { Logo } from "@/components/common/logo"
import { ThemeSwitcher } from "@/components/common/theme-switcher"
import { FavoritosNavLink } from "@/modules/favoritos/components/favoritos-nav-link"

import { AuthActions } from "./auth-actions"
import { IconNavLink } from "./icon-nav-link"
import { ProductSearchBar } from "./product-search-bar"

/** Header adaptable; comparte las columnas con MainNav para alinear el buscador. */
export function AppHeader() {
  return (
    <header className="border-b border-[var(--color-ink-border)] bg-[var(--color-ink)] text-[var(--color-on-ink)]">

      <div className="mx-auto grid max-w-[var(--container-wide)] grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2 gap-y-3 px-4 py-3 sm:gap-x-4 sm:px-6 lg:h-[72px] lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_22rem] lg:py-0">
        <Link
          href="/"
          aria-label="Ir al inicio"
          className="flex min-w-0 shrink-0 items-center justify-self-start [&_img]:max-w-full [&_img]:object-contain"
        >

          <Logo variant="mark" tone="white" height={32} priority className="sm:hidden" />
          <Logo variant="lockup" tone="white" height={32} priority className="hidden sm:inline-flex" />
        </Link>

        <ProductSearchBar className="order-last col-span-2 w-full min-w-0 lg:order-none lg:col-span-1 lg:max-w-2xl lg:min-w-0 lg:justify-self-center" />

        <div className="flex min-w-0 shrink-0 items-center gap-1 justify-self-end">
          <FavoritosNavLink />
          <IconNavLink
            href="/listas"
            icon={ClipboardList}
            label="Mis listas"
          />
          <IconNavLink
            href="/carrito"
            icon={ShoppingCart}
            label="Carrito de compras"
          />
          <span
            aria-hidden
            className="mx-1 h-6 w-px bg-[var(--color-ink-border)]"
          />
          <ThemeSwitcher variant="on-ink" />
          <AuthActions />
        </div>
      </div>
    </header>
  )
}
