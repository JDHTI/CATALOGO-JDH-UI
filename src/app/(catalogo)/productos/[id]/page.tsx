import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { CatalogoPage } from "@/components/layout/catalogo-page"
import { ProductoDetalleView } from "@/modules/catalogo"
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
  return (
    <CatalogoPage>
      <script type="application/ld+json">
        {serializarJsonLd(productoJsonLd(producto))}
      </script>
      <ProductoDetalleView producto={producto} />
    </CatalogoPage>
  )
}
