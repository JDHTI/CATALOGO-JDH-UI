import { Suspense } from "react"
import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { CatalogoPage } from "@/components/layout/catalogo-page"
import { CatalogoView, CatalogoViewFallback } from "@/modules/catalogo"
import { SLUG_MARCA, marcaMetadata } from "@/modules/catalogo/seo"
import { obtenerMarcaPublica } from "@/modules/catalogo/server/queries"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  if (!SLUG_MARCA.test(slug)) notFound()
  let marca
  try {
    marca = await obtenerMarcaPublica(slug)
  } catch {
    // Mismo criterio que la ficha de producto: un fallo del API no se indexa.
    return {
      title: { absolute: "No pudimos cargar la marca" },
      description: null,
      robots: { index: false, follow: false },
      alternates: { canonical: null },
      openGraph: null,
      twitter: null,
    }
  }
  if (!marca) notFound()
  return marcaMetadata(marca, slug)
}

/**
 * Página de marca: el mismo listado que `/productos` con la marca fijada por
 * la ruta. La URL lleva el slug del API (estable y legible), no el id de la
 * BD, para que un enlace compartido o indexado siga valiendo. Un slug mal
 * formado es 404 sin preguntarle al API.
 */
export default async function MarcaPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  if (!SLUG_MARCA.test(slug)) notFound()
  const marca = await obtenerMarcaPublica(slug)
  if (!marca) notFound()

  return (
    <CatalogoPage>
      <Suspense fallback={<CatalogoViewFallback />}>
        <CatalogoView marca={marca} />
      </Suspense>
    </CatalogoPage>
  )
}
