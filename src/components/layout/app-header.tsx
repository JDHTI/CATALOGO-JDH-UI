"use client"

import Link from "next/link"
import { Heart, ShoppingCart } from "lucide-react"

import { Logo } from "@/components/common/logo"

import { AuthActions } from "./auth-actions"
import { IconNavLink } from "./icon-nav-link"
import { ProductSearchBar } from "./product-search-bar"

/**
 * Franja principal del header (DESIGN.md §4.1) — chrome negro. Logo, el
 * buscador doble (categoría + producto) y, a la derecha, los accesos de
 * cuenta: favoritos, carrito y "Mi cuenta" (`AuthActions`).
 *
 * El contenido se centra dentro de `--container-wide` (igual que `MainNav`,
 * justo debajo) en vez de estirarse borde a borde — el fondo negro sí llega
 * al borde, solo la fila de contenido queda acotada y centrada.
 *
 * Los datos de contacto (teléfono, email, WhatsApp, Instagram) y el selector
 * de tema viven en la PRIMERA barra (`ContactBar`), también negra — las tres
 * franjas son el mismo chrome, separadas por líneas hairline. El mega menú y
 * las categorías destacadas viven en la TERCERA barra (`MainNav`).
 *
 * En móvil favoritos/carrito/cuenta pierden el texto y quedan como íconos
 * (además de existir `MobileBottomNav`); la búsqueda nunca se oculta.
 */
export function AppHeader() {
  return (
    <header className="border-b border-[var(--color-ink-border)] bg-[var(--color-ink)] text-[var(--color-on-ink)]">
      {/*
        Grid de 3 columnas SIMÉTRICAS (1fr_2fr_1fr): a diferencia de
        `auto_1fr_auto`, las columnas laterales son iguales, así que la
        columna central —y con ella la barra de búsqueda— queda centrada
        respecto al ANCHO TOTAL del header, no respecto al hueco libre entre
        logo y acciones. Como el clúster de acciones es más ancho que el
        logo, el resultado visual es más aire entre logo y buscador que entre
        buscador y acciones: el buscador se lee como el elemento central.
      */}
      <div className="mx-auto grid h-[72px] max-w-[var(--container-wide)] grid-cols-[1fr_2fr_1fr] items-center gap-4 px-4 sm:px-6">
        <Link
          href="/"
          aria-label="Ir al inicio"
          className="flex shrink-0 items-center justify-self-start"
        >
          {/* Lockup completo: isotipo (mark) + wordmark compuestos en render
              (logo.tsx, variant "lockup") — cada parte se escala de su propio
              asset, más nítido que el `compact` horneado. El mark es
              decorativo (alt=""), el nombre lo aporta el wordmark. */}
          <Logo variant="lockup" tone="white" height={32} priority />
        </Link>

        <ProductSearchBar className="w-full max-w-2xl justify-self-center" />

        <div className="flex shrink-0 items-center gap-1 justify-self-end">
          <IconNavLink href="/favoritos" icon={Heart} label="Favoritos" />
          <IconNavLink
            href="/carrito"
            icon={ShoppingCart}
            label="Carrito de compras"
          />
          <span
            aria-hidden
            className="mx-1 h-6 w-px bg-[var(--color-ink-border)]"
          />
          <AuthActions />
        </div>
      </div>
    </header>
  )
}
