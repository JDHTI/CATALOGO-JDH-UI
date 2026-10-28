import { aProducto, productoDtoSchema } from "@/modules/catalogo/schemas/api"

/** Datos sintéticos exclusivos de pruebas; nunca entran al catálogo. */
export const productoDto = {
  id: 42,
  sku: "TEST-42",
  nombre: "Producto de prueba",
  descripcion: "68450362",
  descripcionLarga: "Primer párrafo editorial.\n\nSegundo párrafo editorial.",
  seo: {
    title: "Título editorial | JDH",
    description: "Resumen editorial de prueba.",
  },
  marca: "Marca de prueba",
  fabricante: "Fabricante de prueba",
  proveedor: { id: 7, nombre: "Proveedor de prueba" },
  categoria: {
    id: 8,
    nombre: "Categoría de prueba",
    slug: "categoria-de-prueba",
  },
  subcategoria: null,
  imagenUrl: "https://images.example.com/card.webp",
  imagenUrlFallback: "https://images.example.com/fallback.webp",
  imagenes: [
    {
      thumbUrl: "https://images.example.com/thumb.webp",
      cardUrl: "https://images.example.com/card.webp",
      fullUrl: "https://images.example.com/full.webp",
      alt: null,
      position: 0,
      esPrincipal: true,
    },
  ],
}

export const producto = aProducto(productoDtoSchema.parse(productoDto))
export const paginaDto = {
  data: [productoDto],
  meta: { page: 1, limit: 12, total: 1, totalPages: 1 },
}
