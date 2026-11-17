import { afterEach, expect, it, vi } from "vitest"
import { recomendarAlternativas } from "@/modules/catalogo/api/recomendaciones"
import { listarProductos } from "@/modules/catalogo/api/client"
import { producto } from "./producto-fixture"
vi.mock("@/modules/catalogo/api/client", () => ({ listarProductos: vi.fn() }))
afterEach(() => {
  vi.resetAllMocks()
  vi.restoreAllMocks()
})
const pagina = (data: (typeof producto)[], totalPages = 1) => ({
  data,
  meta: { page: 1, limit: 6, total: data.length, totalPages },
})
it("recomienda otros productos del proveedor sin incluir el actual", async () => {
  vi.mocked(listarProductos).mockResolvedValue(
    pagina([producto, { ...producto, id: "otro" }])
  )
  const result = await recomendarAlternativas(producto, 5)
  expect(result.origen).toBe("proveedor")
  expect(result.productos.map((p) => p.id)).toEqual(["otro"])
  expect(listarProductos).toHaveBeenCalledTimes(1)
  expect(listarProductos).toHaveBeenCalledWith(
    expect.objectContaining({ supplierId: producto.proveedor.id }),
    undefined,
    "publico"
  )
})
it("elige una pagina aleatoria del catalogo si el proveedor solo tiene el producto actual", async () => {
  vi.spyOn(Math, "random").mockReturnValue(0.75)
  vi.mocked(listarProductos)
    .mockResolvedValueOnce(pagina([producto]))
    .mockResolvedValueOnce(pagina([producto], 4))
    .mockResolvedValueOnce(pagina([{ ...producto, id: "aleatorio" }], 4))
  const result = await recomendarAlternativas(producto, 5)
  expect(result.origen).toBe("catalogo")
  expect(result.productos.map((p) => p.id)).toEqual(["aleatorio"])
  expect(listarProductos).toHaveBeenLastCalledWith(
    { page: 4, limit: 6 },
    undefined,
    "publico"
  )
})
it("no recomienda el propio producto si es el unico del catalogo", async () => {
  vi.mocked(listarProductos).mockResolvedValue(pagina([producto]))
  expect((await recomendarAlternativas(producto, 5)).productos).toEqual([])
})
