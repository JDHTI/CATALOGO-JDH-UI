import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { CatalogoPage } from "@/components/layout/catalogo-page"
import { MismaMarcaSection, ProductoDetalleView } from "@/modules/catalogo"
import {
  productoJsonLd,
  productoMetadata,
  serializarJsonLd,
} from "@/modules/catalogo/seo"
import { getPriceContext } from "@/lib/precios"
import { obtenerProductoPara } from "@/modules/catalogo/server/empleado"
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
 * Metadatos y JSON-LD salen siempre de la lectura PÚBLICA (lo indexable no
 * puede depender de quién mira). El cuerpo sale de la lectura de la audiencia:
 * para un empleado trae además `precioEmpleado`; para el resto es la misma
 * lectura pública, compartida con `generateMetadata` por `cache`.
 */
export default async function ProductoDetallePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const producto = await obtenerProductoPara(id, await getPriceContext())
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
      <CatalogoPage compacta className="pb-3 md:pb-3 lg:pb-3">
        <script type="application/ld+json">
          {serializarJsonLd(productoJsonLd(producto))}
        </script>
        <ProductoDetalleView producto={producto} />
      </CatalogoPage>
      <CatalogoPage className="pt-3 pb-8 lg:pt-3">
        <MismaMarcaSection
          key={producto.id}
          producto={producto}
          className="border-t border-[var(--color-border)] pt-5"
        />
      </CatalogoPage>
    </>
  )
}
