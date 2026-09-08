import { afterEach, expect, it, vi } from "vitest"

vi.mock("server-only", () => ({}))

import { obtenerProductoPublico } from "@/modules/catalogo/server/queries"
import { producto, productoDto } from "./producto-fixture"

afterEach(() => vi.unstubAllGlobals())

it("consulta el contrato público validado para SSR con límite de espera", async () => {
  const fetch = vi.fn().mockResolvedValue(Response.json(productoDto))
  vi.stubGlobal("fetch", fetch)
  expect(await obtenerProductoPublico("42")).toEqual(producto)
  expect(fetch.mock.calls[0][1].signal).toBeDefined()
})

it("convierte solo un 404 del API en ausencia de producto", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(new Response(null, { status: 404 }))
  )
  await expect(obtenerProductoPublico("42")).resolves.toBeNull()
})

it.each([429, 500, 503])(
  "propaga %s al límite de error, nunca como producto ausente",
  async (status) => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(null, { status }))
    )
    await expect(obtenerProductoPublico("42")).rejects.toMatchObject({
      statusCode: status,
    })
  }
)

it("propaga errores de red y de contrato sin inventar un producto", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockRejectedValue(new TypeError("Network error"))
  )
  await expect(obtenerProductoPublico("42")).rejects.toThrow("Network error")
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockResolvedValue(Response.json({ ...productoDto, seo: "incorrecto" }))
  )
  await expect(obtenerProductoPublico("42")).rejects.toThrow()
})
