import { describe, expect, it } from "vitest"
import { renderToStaticMarkup } from "react-dom/server"

import { siteConfig } from "@/config/site"
import {
  productoCanonical,
  productoJsonLd,
  productoMetadata,
  serializarJsonLd,
} from "@/modules/catalogo/seo"
import { producto } from "./producto-fixture"

describe("SEO del producto", () => {
  it("usa el SEO exacto en title, description, OG y Twitter", () => {
    expect(productoMetadata(producto)).toMatchObject({
      title: { absolute: producto.seo.title },
      description: producto.seo.description,
      alternates: { canonical: "https://catalogo.jdh.com.co/productos/42" },
      openGraph: {
        title: producto.seo.title,
        description: producto.seo.description,
        images: [{ url: producto.imagenes[0].fullUrl }],
      },
      twitter: {
        title: producto.seo.title,
        description: producto.seo.description,
      },
    })
  })

  it.each([
    { title: null, description: null },
    { title: " ", description: "" },
    { title: "Título", description: null },
    { title: null, description: "Resumen" },
  ])("resuelve cada campo pendiente con el nombre: %j", (seo) => {
    const title = seo.title?.trim() || producto.nombre
    const description = seo.description?.trim() || producto.nombre
    expect(productoMetadata({ ...producto, seo })).toMatchObject({
      title: { absolute: title },
      description,
      openGraph: { title, description },
      twitter: { title, description },
    })
  })

  it("codifica la identidad en la ruta pública, sin convertirla en query o fragmento", () => {
    expect(productoCanonical("id /?#")).toBe(
      "https://catalogo.jdh.com.co/productos/id%20%2F%3F%23"
    )
  })

  it("cambia imágenes ausentes/incorrectas por la tarjeta de marca, nunca por el fallback de UI", () => {
    for (const imagenUrl of [
      null,
      "",
      "/placeholder.webp",
      "javascript:alert(1)",
      "https://user:password@example.com/image",
    ]) {
      const sinImagen = { ...producto, imagenes: [], imagenUrl }
      expect(productoMetadata(sinImagen)).toMatchObject({
        openGraph: { images: [siteConfig.ogImage] },
        twitter: {
          card: "summary_large_image",
          images: [siteConfig.ogImage.url],
        },
      })
      expect(productoJsonLd(sinImagen)).not.toHaveProperty("image")
    }
  })

  it("usa la primaria legacy si no existe galería, nunca una secundaria", () => {
    const legacy = { ...producto, imagenes: [] }
    expect(productoJsonLd(legacy).image).toBe(producto.imagenUrl)
    expect(
      productoJsonLd({
        ...legacy,
        imagenUrl: null,
        imagenes: [{ ...producto.imagenes[0], esPrincipal: false }],
      })
    ).not.toHaveProperty("image")
  })

  it("publica solo atributos verificados, sin inventar ofertas o reseñas", () => {
    expect(productoJsonLd(producto)).toEqual({
      "@context": "https://schema.org",
      "@type": "Product",
      name: producto.nombre,
      sku: producto.sku,
      url: "https://catalogo.jdh.com.co/productos/42",
      description: producto.descripcionLarga,
      brand: { "@type": "Brand", name: producto.marca },
      image: producto.imagenes[0].fullUrl,
    })
    expect(
      productoJsonLd({
        ...producto,
        descripcionLarga: null,
        marca: "",
        sku: "",
        imagenUrl: null,
        imagenes: [],
      })
    ).toEqual({
      "@context": "https://schema.org",
      "@type": "Product",
      name: producto.nombre,
      url: "https://catalogo.jdh.com.co/productos/42",
    })
  })

  it("serializa JSON válido sin permitir cerrar el script desde datos del API", () => {
    const attack = '</script><script>alert("xss")</script><!-- & >'
    const value = productoJsonLd({
      ...producto,
      nombre: attack,
      descripcionLarga: attack,
      marca: attack,
      sku: attack,
    })
    const html = renderToStaticMarkup(
      <script type="application/ld+json">{serializarJsonLd(value)}</script>
    )
    const dom = new DOMParser().parseFromString(html, "text/html")
    expect(dom.querySelectorAll("script")).toHaveLength(1)
    expect(JSON.parse(dom.querySelector("script")!.textContent!)).toEqual(value)
    expect(html).not.toContain("<script>alert")
  })
})
