import { listarProductos, type FuenteProductos } from "./client"
import type { Producto } from "../types"

/** Primero el proveedor; sin alternativas se elige una pagina aleatoria del catalogo. */
export async function recomendarAlternativas(
  producto: Producto,
  limite: number,
  signal?: AbortSignal,
  fuente: FuenteProductos = "publico"
) {
  const otros = (items: Producto[]) =>
    items.filter((p) => p.id !== producto.id).slice(0, limite)
  const proveedor = await listarProductos(
    {
      supplierId: producto.proveedor.id,
      limit: limite + 1,
      orderBy: "conImagen",
    },
    signal,
    fuente
  )
  const productos = otros(proveedor.data)
  if (productos.length) return { origen: "proveedor" as const, productos }

  const primera = await listarProductos({ limit: limite + 1 }, signal, fuente)
  const paginas = Math.max(1, primera.meta.totalPages)
  const pagina = 1 + Math.floor(Math.random() * paginas)
  const candidatos =
    pagina === 1
      ? primera
      : await listarProductos(
          { page: pagina, limit: limite + 1 },
          signal,
          fuente
        )
  // Barajado dentro de la pagina elegida, sin repetir el producto actual.
  const mezclados = [...candidatos.data]
  for (let i = mezclados.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[mezclados[i], mezclados[j]] = [mezclados[j], mezclados[i]]
  }
  return { origen: "catalogo" as const, productos: otros(mezclados) }
}
