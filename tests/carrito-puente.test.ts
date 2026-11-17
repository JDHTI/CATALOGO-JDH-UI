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

import * as carrito from "@/app/api/carrito/[[...ruta]]/route"
import * as pedidos from "@/app/api/pedidos/[[...ruta]]/route"

const pedir = (method: string, ruta?: string[], body?: unknown) =>
  (carrito as Record<string, typeof carrito.GET>)[method](
    new Request("http://ui.test/api/carrito", {
      method,
      ...(body !== undefined && { body: JSON.stringify(body) }),
    }),
    { params: Promise.resolve({ ruta }) }
  )

beforeEach(() => {
  vi.stubEnv("BACKEND_API_URL", "http://api.test/api/v1")
  backendFetch.mockImplementation(async () => Response.json({ ok: true }))
})
afterEach(() => vi.unstubAllEnvs())

describe("puente /api/carrito", () => {
  it.each([
    ["GET", undefined, "/cart"],
    ["DELETE", undefined, "/cart"],
    ["POST", ["items", "42"], "/cart/items/42"],
    ["PUT", ["items", "42"], "/cart/items/42"],
    ["DELETE", ["items", "42"], "/cart/items/42"],
    ["POST", ["desde-lista", "l1"], "/cart/from-list/l1"],
    ["GET", ["finalizar"], "/cart/checkout"],
    ["POST", ["finalizar"], "/cart/checkout"],
  ])("%s %j → %s", async (method, ruta, destino) => {
    const res = await pedir(method, ruta)
    expect(res.status).toBe(200)
    expect(backendFetch.mock.calls[0][0]).toBe(destino)
    expect(backendFetch.mock.calls[0][1]).toMatchObject({
      method,
      cache: "no-store",
    })
    expect(res.headers.get("cache-control")).toBe("private, no-store")
  })

  it.each([
    ["PUT", undefined],
    ["GET", ["items", "42"]],
    ["POST", ["items"]],
    ["DELETE", ["finalizar"]],
    ["GET", ["otra-cosa"]],
    ["POST", ["items", "42", "extra"]],
  ])("rechaza %s %j sin llamar al API", async (method, ruta) => {
    expect((await pedir(method, ruta)).status).toBe(404)
    expect(backendFetch).not.toHaveBeenCalled()
  })

  it("reenvía el cuerpo JSON tal cual", async () => {
    await pedir("POST", ["items", "42"], { quantity: 3 })
    const init = backendFetch.mock.calls[0][1]
    expect(init.body).toBe('{"quantity":3}')
    expect(init.headers["Content-Type"]).toBe("application/json")
  })

  it("propaga 403 (cuenta de cliente) y 409 con su cuerpo", async () => {
    backendFetch.mockImplementation(async () =>
      Response.json({ statusCode: 409, resumen: { total: 1 } }, { status: 409 })
    )
    const res = await pedir("POST", ["finalizar"], { totalEsperado: 1 })
    expect(res.status).toBe(409)
    expect(await res.json()).toMatchObject({ resumen: { total: 1 } })
  })

  it("sin sesión 401 y sin BACKEND_API_URL 501", async () => {
    backendFetch.mockRejectedValue(new BackendUnauthenticatedError())
    expect((await pedir("GET")).status).toBe(401)
    vi.stubEnv("BACKEND_API_URL", "")
    expect((await pedir("GET")).status).toBe(501)
  })
})

describe("puente /api/pedidos", () => {
  const get = (ruta?: string[]) =>
    pedidos.GET(new Request("http://ui.test/api/pedidos"), {
      params: Promise.resolve({ ruta }),
    })

  it("lista y detalle, nada más", async () => {
    await get()
    await get(["ped-1"])
    expect(backendFetch.mock.calls.map((c) => c[0])).toEqual([
      "/orders",
      "/orders/ped-1",
    ])
    expect((await get(["a", "b"])).status).toBe(404)
  })
})
