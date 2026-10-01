import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { CatalogoPage } from "@/components/layout/catalogo-page"
import { MismaMarcaSection, ProductoDetalleView } from "@/modules/catalogo"
import {
  productoJsonLd,
  productoMetadata,
  serializarJsonLd,
} from "@/modules/catalogo/seo"
import { obtenerProductoPublico } from "@/modules/catalogo/server/queries"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  let producto
  try {
    producto = await obtenerProductoPublico(id)
  } catch {
    // La página propaga el error al boundary; tampoco debe indexarse si
    // el streaming ya envió HTTP 200 antes de que fallara la consulta.
    return {
      title: { absolute: "No pudimos cargar el producto" },
      description: null,
      robots: { index: false, follow: false },
      alternates: { canonical: null },
      openGraph: null,
      twitter: null,
    }
  }
  if (!producto) notFound()
  return productoMetadata(producto)
}

/**
 * Página y metadatos comparten la misma lectura pública en servidor.
 */
export default async function ProductoDetallePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const producto = await obtenerProductoPublico(id)
  if (!producto) notFound()
  // La ficha llena la primera pantalla (`compacta`) y "Más de la marca" va
  // DEBAJO, en su propio contenedor: la página scrollea hasta ella sin que la
  // ficha pierda su reparto al viewport. `pb-8` quita el colchón de la barra
  // inferior móvil a la ficha. El último contenedor tampoco lo necesita: el
  // layout ya reserva el alto de esa barra (`pb-[calc(3.5rem+…)]`), y sumarle
  // el `pb-24` de `CatalogoPage` dejaba ~150px en blanco bajo "Más de la
  // marca" — la página seguía bajando sin nada que mostrar (no hay footer en
  // esta ruta). `pb-8` es el mismo cierre que en escritorio.
  return (
    <>
      <CatalogoPage compacta className="pb-8">
        <script type="application/ld+json">
          {serializarJsonLd(productoJsonLd(producto))}
        </script>
        <ProductoDetalleView producto={producto} />
      </CatalogoPage>
      <CatalogoPage className="pt-4 pb-8 lg:pt-8">
        <MismaMarcaSection
          key={producto.id}
          producto={producto}
          className="border-t border-[var(--color-border)] pt-10"
        />
      </CatalogoPage>
    </>
  )
}
