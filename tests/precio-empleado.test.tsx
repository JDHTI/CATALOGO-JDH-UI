import { afterEach, describe, expect, it, vi } from "vitest"

// Una card con precio de empleado monta «Agregar al carrito», que usa el
// router de Next para la acción del toast.
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }))

import { render, screen } from "./render-con-providers"

import { formatFechaCorta } from "@/lib/format"
import { listarProductos, obtenerProducto } from "@/modules/catalogo/api/client"
import { ProductoCard } from "@/modules/catalogo/components/producto-card"
import { ProductoDetalleView } from "@/modules/catalogo/components/producto-detalle-view"
import { aProducto, productoDtoSchema } from "@/modules/catalogo/schemas/api"
import { paginaDto, productoDto } from "./producto-fixture"

/** Contrato del API (`docs/product-prices.md`): pesos enteros. */
const precioDto = {
  precio: 49863,
  precioConIva: 59337,
  ivaPct: 19,
  ivaEtiqueta: "IVA 19 %",
  moneda: "COP",
  unidad: "UNIDAD",
  fechaFoto: "2026-11-17",
}

/** Grupo SIN IVA de SIESA (arroz, sal…): tarifa conocida al 0 %. */
const sinIvaDto = {
  ...precioDto,
  precioConIva: 49863,
  ivaPct: 0,
  ivaEtiqueta: "Sin IVA",
}

/** Tarifa desconocida: NO es lo mismo que 0. */
const porConfirmarDto = {
  ...precioDto,
  precioConIva: 49863,
  ivaPct: null,
  ivaEtiqueta: "IVA por confirmar",
}

const conPrecio = (precioEmpleado: unknown) =>
  aProducto(productoDtoSchema.parse({ ...productoDto, precioEmpleado }))

afterEach(() => vi.unstubAllGlobals())

describe("contrato de precioEmpleado", () => {
  it("sin el campo (anónimo o cliente) el dominio no lo trae", () => {
    const producto = aProducto(productoDtoSchema.parse(productoDto))
    expect("precioEmpleado" in producto).toBe(false)
  })

  it("conserva null como «empleado sin precio en la lista»", () => {
    expect(conPrecio(null).precioEmpleado).toBeNull()
  })

  it("pasa los pesos enteros del API a centavos", () => {
    expect(conPrecio(precioDto).precioEmpleado).toEqual({
      valor: 4986300,
      valorConIva: 5933700,
      ivaPct: 19,
      ivaEtiqueta: "IVA 19 %",
      moneda: "COP",
      unidad: "UNIDAD",
      fechaFoto: "2026-11-17",
    })
  })

  it("distingue ivaPct 0 (Sin IVA) de null (IVA por confirmar)", () => {
    expect(conPrecio(sinIvaDto).precioEmpleado).toMatchObject({
      ivaPct: 0,
      ivaEtiqueta: "Sin IVA",
    })
    expect(
      conPrecio({ ...porConfirmarDto, unidad: null }).precioEmpleado
    ).toMatchObject({
      ivaPct: null,
      ivaEtiqueta: "IVA por confirmar",
      unidad: null,
      valorConIva: 4986300,
    })
  })

  it("sin ivaEtiqueta (API anterior) la deriva sin confundir 0 con null", () => {
    const sinEtiqueta = (ivaPct: number | null) =>
      conPrecio({ ...precioDto, ivaPct, ivaEtiqueta: undefined }).precioEmpleado
        ?.ivaEtiqueta
    expect(sinEtiqueta(0)).toBe("Sin IVA")
    expect(sinEtiqueta(null)).toBe("IVA por confirmar")
    expect(sinEtiqueta(5)).toBe("IVA 5 %")
  })

  it("descarta una moneda que no es COP sin romper el parseo", () => {
    expect(conPrecio({ ...precioDto, moneda: "USD" }).precioEmpleado).toBeNull()
  })
})

describe("formatFechaCorta", () => {
  it("formatea la fecha de calendario sin correrla por zona horaria", () => {
    expect(formatFechaCorta("2026-11-17")).toBe("17 nov 2026")
    expect(formatFechaCorta("2026-01-05")).toBe("5 ene 2026")
    expect(formatFechaCorta("otra cosa")).toBe("otra cosa")
  })
})

describe("card y ficha", () => {
  it("anónimos y clientes no ven nada de precio", () => {
    const producto = aProducto(productoDtoSchema.parse(productoDto))
    const { container } = render(<ProductoCard producto={producto} />)
    expect(container.textContent).not.toMatch(/precio|\$|IVA/i)
  })

  it("la card muestra solo el precio final: ni sin IVA ni la tarifa", () => {
    const { container } = render(
      <ProductoCard producto={conPrecio(precioDto)} />
    )
    expect(screen.getByText("Precio empleado")).toBeDefined()
    expect(screen.getByText(/59\.337/)).toBeDefined()
    expect(container.textContent).not.toMatch(/49\.863|IVA/)
    // "UNIDAD" no aporta en la card.
    expect(screen.queryByText(/por unidad/)).toBeNull()
  })

  it("la card muestra la unidad cuando aporta", () => {
    render(
      <ProductoCard
        producto={conPrecio({ ...sinIvaDto, unidad: "CAJA X 12" })}
      />
    )
    expect(screen.getByText("por caja x 12")).toBeDefined()
  })

  it("ninguna tarifa (19, 0 o por confirmar) se pinta en card ni ficha", () => {
    for (const dto of [precioDto, sinIvaDto, porConfirmarDto]) {
      const card = render(<ProductoCard producto={conPrecio(dto)} />)
      expect(card.container.textContent).not.toMatch(/IVA/)
      card.unmount()
    }
  })

  it("la ficha no muestra la tarifa con ninguna tasa", () => {
    for (const dto of [precioDto, sinIvaDto, porConfirmarDto]) {
      const { unmount } = render(
        <ProductoDetalleView producto={conPrecio(dto)} />
      )
      const bloque = screen.getByRole("region", {
        name: "Precio para empleados JDH",
      })
      expect(bloque.textContent).not.toMatch(/IVA/)
      unmount()
    }
  })

  it("producto fuera de la lista: línea discreta, nunca $0", () => {
    const { container } = render(<ProductoCard producto={conPrecio(null)} />)
    expect(screen.getByText("Sin precio de empleado")).toBeDefined()
    expect(container.textContent).not.toMatch(/\$/)
  })

  it("la ficha etiqueta el precio de empleados con la fecha de la foto", () => {
    render(<ProductoDetalleView producto={conPrecio(precioDto)} />)
    const bloque = screen.getByRole("region", {
      name: "Precio para empleados JDH",
    })
    expect(bloque.textContent).toMatch(/59\.337/)
    expect(bloque.textContent).not.toMatch(/49\.863/)
    expect(bloque.textContent).toMatch(/por unidad/)
    expect(bloque.textContent).toMatch(/costos del 17 nov 2026/)
  })

  it("la ficha pública no tiene bloque de precio", () => {
    render(
      <ProductoDetalleView
        producto={aProducto(productoDtoSchema.parse(productoDto))}
      />
    )
    expect(
      screen.queryByRole("region", { name: "Precio para empleados JDH" })
    ).toBeNull()
  })
})

describe("fuente de los productos en el navegador", () => {
  it("un empleado pide por /api/productos del mismo origen, sin caché", async () => {
    const fetch = vi.fn().mockResolvedValue(Response.json(paginaDto))
    vi.stubGlobal("fetch", fetch)
    await listarProductos({ page: 2 }, undefined, "empleado")
    const [url, init] = fetch.mock.calls[0]
    expect(url.href).toBe(`${window.location.origin}/api/productos?page=2`)
    expect(init.cache).toBe("no-store")
  })

  it("la ficha de empleado va a /api/productos/:id", async () => {
    const fetch = vi.fn().mockResolvedValue(Response.json(productoDto))
    vi.stubGlobal("fetch", fetch)
    await obtenerProducto("a/b", undefined, "empleado")
    expect(fetch.mock.calls[0][0].href).toBe(
      `${window.location.origin}/api/productos/a%2Fb`
    )
  })

  it.each([401, 501, 502, 503])(
    "si el puente responde %s cae al API público en vez de dejar el catálogo vacío",
    async (status) => {
      const fetch = vi
        .fn()
        .mockResolvedValueOnce(new Response(null, { status }))
        .mockResolvedValueOnce(Response.json(paginaDto))
      vi.stubGlobal("fetch", fetch)
      const pagina = await listarProductos({}, undefined, "empleado")
      expect(pagina.data).toHaveLength(1)
      expect(fetch.mock.calls[1][0].href).not.toContain("/api/productos")
      expect(fetch.mock.calls[1][1].cache).toBeUndefined()
    }
  )

  it("un 404 del producto se propaga, no se disfraza de público", async () => {
    const fetch = vi.fn().mockResolvedValue(new Response(null, { status: 404 }))
    vi.stubGlobal("fetch", fetch)
    await expect(
      obtenerProducto("42", undefined, "empleado")
    ).rejects.toMatchObject({ statusCode: 404 })
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it("el público sigue yendo directo al API, sin pasar por la app", async () => {
    const fetch = vi.fn().mockResolvedValue(Response.json(paginaDto))
    vi.stubGlobal("fetch", fetch)
    await listarProductos({})
    expect(fetch.mock.calls[0][0].href).not.toContain("/api/productos")
  })
})
