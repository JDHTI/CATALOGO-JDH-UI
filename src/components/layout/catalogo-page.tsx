/**
 * Contenedor de las páginas internas del catálogo (productos, carrito,
 * cuenta…). El homepage (`/`) no lo usa: su primer slide es full-bleed y
 * aplica el mismo max-width/gutter solo a las secciones posteriores.
 */
export function CatalogoPage({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-[var(--container-wide)] px-6 py-8 pb-24 md:pb-8">
      {children}
    </div>
  )
}
