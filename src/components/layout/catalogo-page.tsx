import { cn } from "@/lib/utils"

/**
 * Contenedor de las páginas internas del catálogo (productos, carrito,
 * cuenta…). El homepage (`/`) no lo usa: su primer slide es full-bleed y
 * aplica el mismo max-width/gutter solo a las secciones posteriores.
 */
export function CatalogoPage({
  children,
  compacta = false,
  className,
}: {
  children: React.ReactNode
  /** Ajustes puntuales de espaciado (se fusiona con tailwind-merge). */
  className?: string
  /**
   * De `lg` hacia arriba la página se dimensiona al VIEWPORT en vez de crecer
   * con su contenido (hoy solo la ficha de producto). El alto sale de
   * `100svh` menos el chrome pegado arriba, con la misma variable que el
   * primer slide del homepage — `CatalogoChrome` la mide en vivo con un
   * ResizeObserver, así que no hay ningún número a mano que se rompa cuando
   * cambie la barra.
   *
   * Por DEBAJO de `lg` no se aplica: en un teléfono, meter foto, descripción
   * y ficha técnica en una pantalla deja el texto en una franja inservible.
   * Ahí la página scrollea como cualquier otra y la foto sube al desplazar.
   *
   * Requiere que la ruta oculte el footer (ver `SiteFooter`): con él, el
   * shell suma su alto y la página scrollea igual.
   */
  compacta?: boolean
}) {
  return (
    <div
      className={cn(
        // `px-4` en móvil como el header (que usa `px-4 sm:px-6`), para que la
        // foto de producto llegue casi al borde y el breadcrumb quede a plomo
        // con el logo.
        "mx-auto w-full max-w-[var(--container-wide)] px-4 sm:px-6",
        compacta
          ? "py-8 pb-24 md:pb-8 lg:flex lg:h-[calc(100svh-var(--catalogo-chrome-height))] lg:flex-col lg:overflow-hidden lg:py-4"
          : "py-8 pb-24 md:pb-8",
        className
      )}
    >
      {children}
    </div>
  )
}
