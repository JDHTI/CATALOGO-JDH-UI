import { cn } from "@/lib/utils"

/**
 * Contenedor de las páginas internas del catálogo (productos, carrito,
 * cuenta…). El homepage (`/`) no lo usa: su primer slide es full-bleed y
 * aplica el mismo max-width/gutter solo a las secciones posteriores.
 */
export function CatalogoPage({
  children,
  compacta = false,
}: {
  children: React.ReactNode
  /**
   * La página se dimensiona al VIEWPORT en vez de crecer con su contenido
   * (hoy solo la ficha de producto). El alto sale de `100svh` menos el chrome
   * pegado arriba, usando la misma variable que el primer slide del homepage
   * — `CatalogoChrome` la mide en vivo con un ResizeObserver, así que no hay
   * ningún número a mano que se rompa cuando cambie la barra.
   *
   * Requiere que la ruta oculte el footer (ver `SiteFooter`): con él, el
   * shell suma su alto y la página scrollea igual.
   */
  compacta?: boolean
}) {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-[var(--container-wide)] px-6",
        compacta
          ? "flex h-[calc(100svh-var(--catalogo-chrome-height))] flex-col overflow-hidden py-4"
          : "py-8 pb-24 md:pb-8"
      )}
    >
      {children}
    </div>
  )
}
