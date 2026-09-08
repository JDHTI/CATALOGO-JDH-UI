import type { Metadata } from "next"

import { siteConfig } from "@/config/site"
import { siteUrl } from "@/config/site-url"

import type { Producto } from "./types"

export function productoCanonical(id: string): string {
  return new URL(`/productos/${encodeURIComponent(id)}`, siteUrl).href
}

/** Solo imágenes primarias publicadas, nunca el placeholder ni secundarias. */
function imagenPrincipal(producto: Producto): string | undefined {
  const primaria = producto.imagenes.find((imagen) => imagen.esPrincipal)
  for (const candidata of [primaria?.fullUrl, producto.imagenUrl]) {
    if (!candidata) continue
    try {
      const url = new URL(candidata)
      if (
        ["https:", "http:"].includes(url.protocol) &&
        !url.username &&
        !url.password
      ) {
        return url.href
      }
    } catch {
      // Una URL relativa o inválida no prueba que exista una imagen pública.
    }
  }
}

export function productoMetadata(producto: Producto): Metadata {
  const title = producto.seo.title?.trim() || producto.nombre
  const description = producto.seo.description?.trim() || producto.nombre
  const url = productoCanonical(producto.id)
  const image = imagenPrincipal(producto)

  return {
    // Evita que el template del layout añada otra marca al título editorial.
    title: { absolute: title },
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      locale: "es_CO",
      siteName: siteConfig.company,
      title,
      description,
      url,
      images: image ? [{ url: image, alt: producto.nombre }] : [],
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
      images: image ? [image] : [],
    },
  }
}

export function productoJsonLd(producto: Producto) {
  const image = imagenPrincipal(producto)
  // La descripción del ERP puede ser un código: no se usa como copy.
  const description = producto.descripcionLarga?.trim()
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: producto.nombre,
    url: productoCanonical(producto.id),
    ...(producto.sku.trim() && { sku: producto.sku }),
    ...(producto.marca.trim() && {
      brand: { "@type": "Brand", name: producto.marca },
    }),
    ...(description && { description }),
    ...(image && { image }),
  }
}

/** Impide cerrar el script desde cualquier campo del API, incluido nombre. */
export function serializarJsonLd(
  value: ReturnType<typeof productoJsonLd>
): string {
  return JSON.stringify(value).replace(/</g, "\\u003c")
}
