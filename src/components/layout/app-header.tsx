"use client"

import Link from "next/link"
import { Heart, ShoppingCart } from "lucide-react"

import { Logo } from "@/components/common/logo"
import { ThemeSwitcher } from "@/components/common/theme-switcher"

import { AuthActions } from "./auth-actions"
import { IconNavLink } from "./icon-nav-link"
import { ProductSearchBar } from "./product-search-bar"

/**
 * Franja principal del header (DESIGN.md §4.1) — chrome negro. Logo, el
 * buscador doble (categoría + producto) y, a la derecha, los accesos de
 * cuenta: favoritos, carrito y "Mi cuenta" (`AuthActions`).
 *
 * RESPONSIVE: en desktop (lg+) es un grid de 3 columnas simétricas
 * (1fr_2fr_1fr) con el buscador centrado respecto al ancho TOTAL del
 * header. En <lg pasa a DOS FILAS: logo + acciones en la primera (la
 * búsqueda nunca se oculta) y el buscador full-width en la segunda. La
 * altura del chrome apilado cambia con el breakpoint vía
 * `--catalogo-chrome-height` (ver globals.css) para que el hero reste la
 * altura correcta.
 *
 * El contenido se centra dentro de `--container-wide` (igual que `MainNav`,
 * justo debajo) en vez de estirarse borde a borde — el fondo negro sí llega
 * al borde, solo la fila de contenido queda acotada y centrada.
 *
 * Los datos de contacto (teléfono, email, WhatsApp, Instagram) viven en la
 * PRIMERA barra (`ContactBar`), también negra — las tres franjas son el
 * mismo chrome, separadas por líneas hairline. El mega menú, las categorías
 * destacadas y Promociones viven en la TERCERA barra (`MainNav`, siempre
 * visible, incluso en móvil). El selector de tema vive AQUÍ (no en
 * `ContactBar`, que colapsa al hacer scroll).
 *
 * El logo NO vive en una columna de grid junto a las acciones: dos columnas
 * `1fr` forzadas a igual ancho (el diseño anterior) permiten que CUALQUIERA
 * de las dos se desborde y se solape con la otra en viewports angostos,
 * porque el ancho de cada columna queda fijo al 50% sin importar cuánto
 * contenido tenga — ninguna de las dos se "entera" de la otra. En vez de
 * eso, logo y acciones son hermanos dentro de un `flex justify-between`:
 * cada uno mide exactamente lo que su propio contenido necesita, así que
 * solo compiten por el espacio real que sobra entre ambos, nunca se pisan.
 * `lg:contents` "desaparece" esa fila envolvente en desktop para que logo y
 * acciones vuelvan a ser hijos directos del grid de 3 columnas simétricas
 * (mismo resultado visual que antes, ahí sí con espacio de sobra).
 *
 * Aun así, en el viewport MÁS angosto soportado (320px) el contenido de la
 * fila 1 (logo lockup + 4 accesos) supera el ancho disponible por muy poco
 * si no se recorta: logo a 22px de alto (no 26), `gap-2` en vez de `gap-3`
 * entre logo y acciones, y `ThemeSwitcher` forzado a `size-9` (36px, como
 * los demás íconos de la fila — por defecto usa `size-10`). Ninguno de estos
 * recortes es visible a simple vista; sin ellos, 320px se queda a ~12px de
 * desbordar y el logo vuelve a solaparse con las acciones.
 */
export function AppHeader() {
  return (
    <header className="border-b border-[var(--color-ink-border)] bg-[var(--color-ink)] text-[var(--color-on-ink)]">
      <div className="mx-auto flex max-w-[var(--container-wide)] flex-col gap-3 px-4 py-3 sm:px-6 lg:grid lg:h-[72px] lg:grid-cols-[1fr_2fr_1fr] lg:items-center lg:gap-4 lg:py-0">
        <div className="flex items-center justify-between gap-2 lg:contents">
          <Link
            href="/"
            aria-label="Ir al inicio"
            className="flex min-w-0 shrink items-center lg:order-1 lg:justify-self-start"
          >
            {/* Lockup compuesto (isotipo + wordmark, renderizado en vivo) —
                ver `Logo`/`LOCKUP_TEXT_SCALE` para la proporción de las
                letras. */}
            <Logo
              variant="lockup"
              tone="white"
              height={22}
              priority
              className="sm:hidden"
            />
            <Logo
              variant="lockup"
              tone="white"
              height={36}
              priority
              className="hidden sm:inline-flex"
            />
          </Link>

          {/* Acciones — en mobile van en la primera fila (derecha). */}
          <div className="flex shrink-0 items-center gap-1 lg:order-3 lg:justify-self-end">
            <IconNavLink href="/favoritos" icon={Heart} label="Favoritos" />
            <IconNavLink
              href="/carrito"
              icon={ShoppingCart}
              label="Carrito de compras"
            />
            <span
              aria-hidden
              className="mx-1 hidden h-6 w-px bg-[var(--color-ink-border)] sm:block"
            />
            <ThemeSwitcher variant="on-ink" className="size-9" />
            <AuthActions />
          </div>
        </div>

        {/* Búsqueda — fila 2 completa en mobile, columna central en desktop. */}
        <ProductSearchBar className="w-full lg:order-2 lg:max-w-2xl lg:justify-self-center" />
      </div>
    </header>
  )
}
