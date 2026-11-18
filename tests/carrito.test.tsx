import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { waitFor } from "@testing-library/react"

import { fireEvent, render, screen, within } from "./render-con-providers"
import { productoDto } from "./producto-fixture"

const nav = vi.hoisted(() => ({ push: vi.fn() }))
vi.mock("next/navigation", () => ({ useRouter: () => nav }))

const sesion = vi.hoisted(() => ({ empleado: true }))
vi.mock("@/hooks/use-current-user", () => ({
  useCurrentUser: () => ({
    user: sesion.empleado ? { id: "u1", empleado: true } : { id: "u2" },
    permissions: [],
    isPending: false,
  }),
}))

// La vitrina de recomendados tiene sus propias pruebas; aquí solo importa qué
// productos recibe para excluirlos.
vi.mock("@/modules/catalogo", async (original) => ({
  ...(await original<typeof import("@/modules/catalogo")>()),
  OlvidasteAlgoSection: ({ productos }: { productos: { id: string }[] }) => (
    <p>¿Olvidaste algo? sin {productos.map((p) => p.id).join(",")}</p>
  ),
}))

import { getQueryClient } from "@/lib/query-client"
import {
  CarritoApiError,
  enviarPedido,
  obtenerCarrito,
} from "@/modules/carrito/api/client"
import { AgregarAlCarritoFicha } from "@/modules/carrito/components/agregar-al-carrito"
import { CarritoView } from "@/modules/carrito/components/carrito-view"
import { CarritoNavLink } from "@/modules/carrito/components/carrito-nav-link"
import { resumenOmitidos } from "@/modules/carrito/components/comprar-lista-boton"
import { FinalizarPedidoView } from "@/modules/carrito/components/finalizar-pedido-view"
import { PedidoConfirmacionView } from "@/modules/carrito/components/pedido-confirmacion-view"
import { aProducto, productoDtoSchema } from "@/modules/catalogo/schemas/api"

/* ——— Fixtures del contrato (`docs/carrito-pedidos.md`): PESOS enteros ——— */

const precioEmpleado = {
  precio: 69391,
  precioConIva: 82575,
  ivaPct: 19,
  ivaEtiqueta: "IVA 19 %",
  moneda: "COP",
  unidad: "UNIDAD",
  fechaFoto: "2026-11-17",
}

const linea = (over: Record<string, unknown> = {}) => ({
  productId: 42,
  cantidad: 3,
  producto: { ...productoDto, precioEmpleado },
  disponible: true,
  precioUnitario: 69391,
  totalLinea: 208173,
  precioCambio: false,
  ...over,
})

const carritoDto = (items = [linea()], over: Record<string, unknown> = {}) => ({
  items,
  resumen: {
    lineas: items.length,
    unidades: 3,
    subtotal: 208173,
    lineasNoDisponibles: 0,
    ...over,
  },
})

const resumenDto = (over: Record<string, unknown> = {}) => ({
  lineas: [
    {
      productId: 42,
      sku: "TEST-42",
      nombre: "Producto de prueba",
      cantidad: 3,
      precioUnitario: 69391,
      totalLinea: 208173,
    },
  ],
  subtotal: 208173,
  impuestos: 39553,
  total: 247726,
  ivaPorConfirmar: false,
  fechaFoto: "2026-11-17",
  solicitante: { nombre: "Ana Empleada", email: "ana@jdh.com.co" },
  noDisponibles: [],
  ...over,
})

const pedidoDto = (over: Record<string, unknown> = {}) => ({
  id: "ped-1",
  numero: "PED-000123",
  fecha: "2026-11-17T15:30:00.000Z",
  solicitante: { nombre: "Ana Empleada", email: "ana@jdh.com.co" },
  nota: null,
  lineas: resumenDto().lineas,
  subtotal: 208173,
  impuestos: 39553,
  total: 247726,
  ivaPorConfirmar: false,
  fechaFoto: "2026-11-17",
  correo: "enviado",
  ...over,
})

/** `fetch` por ruta: cada prueba declara qué responde cada endpoint. */
function stubFetch(rutas: Record<string, () => Response>) {
  const fetch = vi.fn(async (url: string | URL, _init?: RequestInit) => {
    const path = String(url).replace(/^https?:\/\/[^/]+/, "")
    const clave = Object.keys(rutas).find((r) => path.startsWith(r))
    if (!clave) return new Response(null, { status: 404 })
    return rutas[clave]()
  })
  vi.stubGlobal("fetch", fetch)
  return fetch
}

// jsdom no trae IntersectionObserver; el encabezado de página lo usa para
// animar la entrada.
class SinInterseccion {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return []
  }
}

beforeEach(() => {
  sesion.empleado = true
  nav.push.mockReset()
  vi.stubGlobal("IntersectionObserver", SinInterseccion)
})
afterEach(() => {
  getQueryClient().clear()
  vi.unstubAllGlobals()
})

describe("contrato", () => {
  it("pasa pesos a centavos y conserva disponibilidad y aviso de precio", async () => {
    stubFetch({
      "/api/carrito": () =>
        Response.json(
          carritoDto([
            linea(),
            linea({
              productId: 7,
              disponible: false,
              precioUnitario: null,
              totalLinea: null,
              precioCambio: true,
            }),
          ])
        ),
    })
    const carrito = await obtenerCarrito()
    expect(carrito.resumen.subtotal).toBe(20817300)
    expect(carrito.lineas[0]).toMatchObject({
      productoId: "42",
      precioUnitario: 6939100,
      totalLinea: 20817300,
    })
    expect(carrito.lineas[1]).toMatchObject({
      productoId: "7",
      disponible: false,
      precioUnitario: null,
      precioCambio: true,
    })
    expect(carrito.lineas[0].producto.precioEmpleado?.valor).toBe(6939100)
  })

  it("envía el total MOSTRADO en pesos y omite una nota vacía", async () => {
    const fetch = stubFetch({
      "/api/carrito/finalizar": () => Response.json(pedidoDto()),
    })
    const pedido = await enviarPedido(24772600, "   ")
    expect(JSON.parse(fetch.mock.calls[0][1]!.body as string)).toEqual({
      totalEsperado: 247726,
    })
    expect(pedido).toMatchObject({ numero: "PED-000123", total: 24772600 })
  })

  it("un 409 de precios trae el resumen nuevo ya en centavos", async () => {
    stubFetch({
      "/api/carrito/finalizar": () =>
        Response.json(
          {
            statusCode: 409,
            code: "PRECIOS_CAMBIARON",
            message:
              "Los precios cambiaron; revisa el pedido antes de enviarlo",
            resumen: resumenDto({ total: 250000 }),
          },
          { status: 409 }
        ),
    })
    const error = await enviarPedido(24772600, "").catch((e: unknown) => e)
    expect(error).toBeInstanceOf(CarritoApiError)
    expect((error as CarritoApiError).code).toBe("PRECIOS_CAMBIARON")
    expect((error as CarritoApiError).resumen?.total).toBe(25000000)
  })

  it("un resumen malformado no se lleva el code ni el mensaje", async () => {
    stubFetch({
      "/api/carrito/finalizar": () =>
        Response.json(
          {
            statusCode: 409,
            code: "NO_DISPONIBLES",
            message: "Hay productos que ya no están disponibles",
            resumen: { otra: "forma" },
            noDisponibles: [7, 9],
          },
          { status: 409 }
        ),
    })
    const error = (await enviarPedido(1, "").catch(
      (e: unknown) => e
    )) as CarritoApiError
    expect(error.code).toBe("NO_DISPONIBLES")
    expect(error.message).toBe("Hay productos que ya no están disponibles")
    expect(error.resumen).toBeUndefined()
    expect(error.noDisponibles).toEqual(["7", "9"])
  })

  it("resume los omitidos de una lista por motivo", () => {
    expect(
      resumenOmitidos([
        { productoId: "1", nombre: "A", motivo: "sin_precio" },
        { productoId: "2", nombre: "B", motivo: "sin_precio" },
        { productoId: "3", nombre: "C", motivo: "inactivo" },
      ])
    ).toEqual([
      "2 productos no se agregaron: sin precio de empleado",
      "1 producto no se agregó: ya no está disponible",
    ])
  })
})

describe("puntos de entrada", () => {
  it("la ficha SUMA la cantidad elegida con POST /api/carrito/items/:id", async () => {
    const fetch = stubFetch({
      "/api/carrito/items/42": () => Response.json(carritoDto()),
    })
    const producto = aProducto(
      productoDtoSchema.parse({ ...productoDto, precioEmpleado })
    )
    render(<AgregarAlCarritoFicha producto={producto} />)
    fireEvent.change(screen.getByRole("spinbutton", { name: "Cantidad" }), {
      target: { value: "3" },
    })
    fireEvent.click(screen.getByRole("button", { name: /Agregar al carrito/ }))
    await waitFor(() => expect(fetch).toHaveBeenCalled())
    const [url, init] = fetch.mock.calls[0]
    expect(String(url)).toBe("/api/carrito/items/42")
    expect(init).toMatchObject({ method: "POST" })
    expect(JSON.parse(init!.body as string)).toEqual({ quantity: 3 })
  })

  it("el header muestra las unidades solo a empleados", async () => {
    stubFetch({ "/api/carrito": () => Response.json(carritoDto()) })
    const { unmount } = render(<CarritoNavLink />)
    expect(
      await screen.findByRole("link", { name: "Carrito de compras (3)" })
    ).toBeDefined()
    unmount()

    sesion.empleado = false
    const fetch = stubFetch({})
    render(<CarritoNavLink />)
    expect(screen.queryByRole("link")).toBeNull()
    expect(fetch).not.toHaveBeenCalled()
  })
})

describe("pantalla del carrito", () => {
  it("muestra precios antes de impuestos, sin IVA, y el carrusel «¿Olvidaste algo?»", async () => {
    stubFetch({ "/api/carrito": () => Response.json(carritoDto()) })
    const { container } = render(<CarritoView />)
    expect(
      await screen.findByText(/208\.173/, { selector: "dd" })
    ).toBeDefined()
    expect(
      screen.getByRole("heading", { level: 1, name: "Mi carrito" })
    ).toBeDefined()
    expect(screen.getByText("Lista de precios de empleados")).toBeDefined()
    // Precio unitario de la fila, con su rótulo para lectores de pantalla.
    const fila = within(
      screen.getByRole("region", { name: "Productos en el carrito" })
    ).getByRole("listitem")
    expect(fila.textContent).toMatch(/Precio unitario \$\s?69\.391/)
    expect(fila.textContent).toMatch(/SKU /)
    // Ya no hay «Vaciar carrito».
    expect(screen.queryByRole("button", { name: /Vaciar/ })).toBeNull()
    expect(
      screen.getByText(/Los impuestos se calculan al finalizar el pedido/)
    ).toBeDefined()
    // Ni el precio con IVA ni la etiqueta de la tarifa.
    expect(container.textContent).not.toMatch(/82\.575|IVA 19/)
    expect(screen.getByText("¿Olvidaste algo? sin 42")).toBeDefined()
    expect(
      screen
        .getByRole("link", { name: /Finalizar pedido/ })
        .getAttribute("href")
    ).toBe("/carrito/finalizar")
  })

  it("una línea no disponible bloquea finalizar y se puede quitar", async () => {
    stubFetch({
      "/api/carrito": () =>
        Response.json(
          carritoDto(
            [
              linea({
                disponible: false,
                precioUnitario: null,
                totalLinea: null,
              }),
            ],
            { subtotal: 0, lineasNoDisponibles: 1 }
          )
        ),
    })
    render(<CarritoView />)
    expect(await screen.findByText("Ya no disponible")).toBeDefined()
    expect(
      (
        screen.getByRole("button", {
          name: /Finalizar pedido/,
        }) as HTMLButtonElement
      ).disabled
    ).toBe(true)
    expect(
      screen.getByRole("button", { name: /Quitar Producto de prueba/ })
    ).toBeDefined()
  })

  it("avisa cuando el precio se actualizó", async () => {
    stubFetch({
      "/api/carrito": () =>
        Response.json(carritoDto([linea({ precioCambio: true })])),
    })
    render(<CarritoView />)
    expect(await screen.findByText("El precio se actualizó")).toBeDefined()
  })

  it("vacío: estado con enlace al catálogo y sin recomendados", async () => {
    stubFetch({
      "/api/carrito": () =>
        Response.json(carritoDto([], { unidades: 0, subtotal: 0 })),
    })
    render(<CarritoView />)
    expect(await screen.findByText("Tu carrito está vacío")).toBeDefined()
    expect(screen.queryByText(/Olvidaste algo/)).toBeNull()
  })
})

describe("finalizar pedido", () => {
  it("muestra subtotal, impuestos y total sin desglose, y el solicitante de Entra", async () => {
    stubFetch({ "/api/carrito/finalizar": () => Response.json(resumenDto()) })
    const { container } = render(<FinalizarPedidoView />)
    expect(await screen.findByText("Ana Empleada")).toBeDefined()
    expect(screen.getByText("ana@jdh.com.co")).toBeDefined()
    expect(screen.getByText("Impuestos")).toBeDefined()
    expect(container.textContent).toMatch(/39\.553/)
    expect(container.textContent).toMatch(/247\.726/)
    expect(container.textContent).not.toMatch(/19\s?%|5\s?%/)
  })

  it("409 de precios: pinta el total nuevo y pide confirmar otra vez", async () => {
    let envios = 0
    stubFetch({
      "/api/carrito/finalizar": () => {
        // GET inicial y luego el POST que choca con precios nuevos.
        return Response.json(resumenDto())
      },
    })
    render(<FinalizarPedidoView />)
    await screen.findByText("Ana Empleada")

    const fetch = stubFetch({
      "/api/carrito/finalizar": () => {
        envios++
        return envios === 1
          ? Response.json(
              {
                statusCode: 409,
                code: "PRECIOS_CAMBIARON",
                message: "Los precios cambiaron",
                resumen: resumenDto({ impuestos: 40000, total: 248173 }),
              },
              { status: 409 }
            )
          : Response.json(pedidoDto({ total: 248173 }))
      },
    })
    fireEvent.click(screen.getByRole("button", { name: /Enviar pedido/ }))
    expect(await screen.findByText(/Los precios cambiaron/)).toBeDefined()
    expect(await screen.findByText(/248\.173/)).toBeDefined()

    fireEvent.click(screen.getByRole("button", { name: /Confirmar y enviar/ }))
    await waitFor(() => expect(nav.push).toHaveBeenCalledWith("/pedidos/ped-1"))
    const posts = fetch.mock.calls.filter(([, init]) => init?.method === "POST")
    expect(posts).toHaveLength(2)
    // El segundo envío lleva el total NUEVO que se le mostró al empleado.
    expect(JSON.parse(posts[1][1]!.body as string).totalEsperado).toBe(248173)
  })

  it.each([
    ["NO_DISPONIBLES", /ya no están disponibles/],
    ["CARRITO_VACIO", /Tu carrito está vacío/],
  ])(
    "409 %s: vuelve al carrito, sin pedir confirmar precios",
    async (code, texto) => {
      stubFetch({ "/api/carrito/finalizar": () => Response.json(resumenDto()) })
      render(<FinalizarPedidoView />)
      await screen.findByText("Ana Empleada")
      vi.mocked(globalThis.fetch).mockImplementationOnce(async () =>
        // El texto dice «precios» a propósito: manda el `code`, no el mensaje.
        Response.json(
          {
            statusCode: 409,
            code,
            message: "precios cambiaron (texto engañoso)",
          },
          { status: 409 }
        )
      )
      fireEvent.click(screen.getByRole("button", { name: /Enviar pedido/ }))
      const alerta = await screen.findByRole("alert")
      expect(alerta.textContent).toMatch(texto)
      expect(
        within(alerta).getByRole("link", { name: "Volver al carrito" })
      ).toBeDefined()
      expect(
        screen.queryByRole("button", { name: /Confirmar y enviar/ })
      ).toBeNull()
    }
  )

  it("409 de precios de un API anterior (sin code ni resumen): vuelve a pedir el resumen", async () => {
    stubFetch({ "/api/carrito/finalizar": () => Response.json(resumenDto()) })
    render(<FinalizarPedidoView />)
    await screen.findByText("Ana Empleada")

    stubFetch({
      "/api/carrito/finalizar": () =>
        Response.json(resumenDto({ total: 250000 })),
    })
    // El POST choca; el GET siguiente trae el total vigente.
    const fetch = vi.mocked(globalThis.fetch)
    fetch.mockImplementationOnce(async () =>
      Response.json(
        {
          statusCode: 409,
          message: "Los precios cambiaron; revisa el pedido antes de enviarlo",
          error: "ConflictException",
        },
        { status: 409 }
      )
    )
    fireEvent.click(screen.getByRole("button", { name: /Enviar pedido/ }))
    expect(await screen.findByText(/Revisa el total actualizado/)).toBeDefined()
    expect(await screen.findByText(/250\.000/)).toBeDefined()
    expect(
      screen.getByRole("button", { name: /Confirmar y enviar/ })
    ).toBeDefined()
  })

  it("422 de sesión: pide volver a iniciar sesión", async () => {
    stubFetch({ "/api/carrito/finalizar": () => Response.json(resumenDto()) })
    render(<FinalizarPedidoView />)
    await screen.findByText("Ana Empleada")
    stubFetch({
      "/api/carrito/finalizar": () =>
        Response.json({ statusCode: 422, message: "x" }, { status: 422 }),
    })
    fireEvent.click(screen.getByRole("button", { name: /Enviar pedido/ }))
    expect(
      await screen.findByRole("link", { name: /Vuelve a iniciar sesión/ })
    ).toBeDefined()
  })
})

describe("confirmación", () => {
  it("muestra el número y, si el correo falló, NO pide repetir el pedido", async () => {
    stubFetch({
      "/api/pedidos/ped-1": () => Response.json(pedidoDto({ correo: "error" })),
    })
    render(<PedidoConfirmacionView id="ped-1" />)
    expect(await screen.findByText("PED-000123")).toBeDefined()
    expect(screen.getByText(/quedó registrado/)).toBeDefined()
    expect(screen.getByText(/no necesitas repetir el pedido/)).toBeDefined()
  })

  it("con el correo enviado dice a quién llegó", async () => {
    stubFetch({ "/api/pedidos/ped-1": () => Response.json(pedidoDto()) })
    render(<PedidoConfirmacionView id="ped-1" />)
    expect(
      await screen.findByText(/Enviamos el consolidado a ana@jdh\.com\.co/)
    ).toBeDefined()
  })
})
