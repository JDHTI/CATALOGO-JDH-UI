// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("server-only", () => ({}))

const { BackendUnauthenticatedError, backendFetch } = vi.hoisted(() => ({
  BackendUnauthenticatedError: class extends Error {},
  backendFetch: vi.fn(),
}))
vi.mock("@/lib/api/backend-fetch", () => ({
  BackendUnauthenticatedError,
  backendFetch,
}))

import { NextRequest } from "next/server"

import { GET } from "@/app/api/productos/[[...ruta]]/route"
import type { PriceContext } from "@/lib/precios/types"
import { obtenerProductoPara } from "@/modules/catalogo/server/empleado"
import { productoDto } from "./producto-fixture"

const precioEmpleado = {
  precio: 1000,
  precioConIva: 1190,
  ivaPct: 19,
  moneda: "COP",
  unidad: "UNIDAD",
  fechaFoto: "2026-11-17",
}

const empleado: PriceContext = {
  audiencia: "empleado",
  clienteId: null,
  listaPrecioId: null,
  mostrarIva: true,
}
const publico: PriceContext = { ...empleado, audiencia: "publico" }

const pedir = (url: string, ruta?: string[]) =>
  GET(new NextRequest(url), { params: Promise.resolve({ ruta }) })

beforeEach(() => vi.stubEnv("BACKEND_API_URL", "http://api.test/api/v1"))
afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe("GET /api/productos/*", () => {
  it("reenvía el listado con su query al API como el usuario, sin caché", async () => {
    backendFetch.mockResolvedValue(Response.json({ data: [], meta: {} }))
    const res = await pedir("http://ui.test/api/productos?page=2&limit=12")
    expect(backendFetch).toHaveBeenCalledWith(
      "/products?page=2&limit=12",
      expect.objectContaining({ cache: "no-store" })
    )
    expect(res.status).toBe(200)
    expect(res.headers.get("cache-control")).toBe("private, no-store")
  })

  it("mapea destacados y ficha a /products/*", async () => {
    backendFetch.mockImplementation(async () => Response.json({}))
    await pedir("http://ui.test/api/productos/destacados?limit=5", [
      "destacados",
    ])
    expect(backendFetch.mock.calls[0][0]).toBe("/products/destacados?limit=5")
    await pedir("http://ui.test/api/productos/42", ["42"])
    expect(backendFetch.mock.calls[1][0]).toBe("/products/42")
  })

  it("no deja usar el puente para otras rutas del API", async () => {
    const res = await pedir("http://ui.test/api/productos/a/b", ["a", "b"])
    expect(res.status).toBe(404)
    expect(backendFetch).not.toHaveBeenCalled()
  })

  it("sin sesión responde 401 y sin BACKEND_API_URL 501", async () => {
    backendFetch.mockRejectedValue(new BackendUnauthenticatedError())
    expect((await pedir("http://ui.test/api/productos")).status).toBe(401)
    vi.stubEnv("BACKEND_API_URL", "")
    expect((await pedir("http://ui.test/api/productos")).status).toBe(501)
  })

  it("propaga el estado del API (p. ej. 404 de un producto)", async () => {
    backendFetch.mockResolvedValue(
      Response.json({ statusCode: 404, message: "x" }, { status: 404 })
    )
    expect((await pedir("http://ui.test/api/productos/9", ["9"])).status).toBe(
      404
    )
  })
})

describe("obtenerProductoPara (ficha en servidor)", () => {
  it("empleado: lee con su JWT y trae precioEmpleado", async () => {
    backendFetch.mockResolvedValue(
      Response.json({ ...productoDto, precioEmpleado })
    )
    const producto = await obtenerProductoPara("42", empleado)
    expect(backendFetch).toHaveBeenCalledWith(
      "/products/42",
      expect.objectContaining({ cache: "no-store" })
    )
    expect(producto?.precioEmpleado?.valorConIva).toBe(119000)
  })

  it("empleado con el puente caído: ficha pública sin precio", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {})
    backendFetch.mockResolvedValue(new Response(null, { status: 401 }))
    const fetch = vi.fn().mockResolvedValue(Response.json(productoDto))
    vi.stubGlobal("fetch", fetch)
    const producto = await obtenerProductoPara("42", empleado)
    expect(fetch).toHaveBeenCalledOnce()
    expect(producto && "precioEmpleado" in producto).toBe(false)
  })

  it("empleado y producto inexistente: null (404), sin segunda lectura", async () => {
    backendFetch.mockResolvedValue(new Response(null, { status: 404 }))
    const fetch = vi.fn()
    vi.stubGlobal("fetch", fetch)
    expect(await obtenerProductoPara("42", empleado)).toBeNull()
    expect(fetch).not.toHaveBeenCalled()
  })

  it("público: nunca toca backendFetch", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(Response.json(productoDto))
    )
    await obtenerProductoPara("77", publico)
    expect(backendFetch).not.toHaveBeenCalled()
  })
})
