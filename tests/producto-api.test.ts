import { afterEach, describe, expect, it, vi } from "vitest"

import {
  listarDestacados,
  listarProductos,
  obtenerProducto,
} from "@/modules/catalogo/api/client"
import { CatalogoApiError } from "@/modules/catalogo/api/errors"
import { aProducto, productoDtoSchema } from "@/modules/catalogo/schemas/api"
import { paginaDto, producto, productoDto } from "./producto-fixture"

afterEach(() => vi.unstubAllGlobals())

describe("contrato editorial progresivo", () => {
  it("conserva los campos editoriales y todos los campos existentes", () => {
    const { descripcion, ...dtoSinRenombrar } = productoDto
    expect(producto).toEqual({
      ...dtoSinRenombrar,
      // El DTO lo llama `descripcion`; el dominio, `referencia`.
      referencia: descripcion,
      id: "42",
      proveedor: {
        id: "7",
        nombre: productoDto.proveedor.nombre,
        logoUrl: null,
      },
      categoria: { id: "8", nombre: productoDto.categoria.nombre },
    })
  })

  it.each([
    {},
    { descripcionLarga: null, seo: null },
    { descripcionLarga: null, seo: { title: null, description: null } },
    { descripcionLarga: " \r\n ", seo: { title: " ", description: "" } },
  ])("admite contenido pendiente o un API anterior: %j", (editorial) => {
    const {
      descripcionLarga: _descripcionLarga,
      seo: _seo,
      imagenUrlFallback: _fallback,
      ...legacy
    } = productoDto
    const result = aProducto(
      productoDtoSchema.parse({ ...legacy, ...editorial })
    )
    expect(result.descripcionLarga).toBeNull()
    expect(result.seo).toEqual({ title: null, description: null })
    expect(result.imagenUrlFallback).toBeNull()
    // El API lo envía como `descripcion`; el dominio lo expone como
    // `referencia` porque su contenido es un código del ERP.
    expect(result.referencia).toBe("68450362")
    expect(result.imagenes).toEqual(producto.imagenes)
  })

  it("acepta SEO parcial y rechaza tipos inválidos", () => {
    expect(
      aProducto(
        productoDtoSchema.parse({ ...productoDto, seo: { title: "Título" } })
      ).seo
    ).toEqual({ title: "Título", description: null })
    expect(
      productoDtoSchema.safeParse({ ...productoDto, descripcionLarga: 42 })
        .success
    ).toBe(false)
    expect(
      productoDtoSchema.safeParse({ ...productoDto, seo: { title: [] } })
        .success
    ).toBe(false)
  })
})

describe("lecturas reales a través del adaptador", () => {
  it.each([listarProductos, listarDestacados])(
    "preserva editorial en listado y destacados",
    async (read) => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue(Response.json(paginaDto))
      )
      expect((await read()).data).toEqual([producto])
    }
  )

  it("lee el detalle y propaga la cancelación sin enviar sesión", async () => {
    const fetch = vi.fn().mockResolvedValue(Response.json(productoDto))
    vi.stubGlobal("fetch", fetch)
    const signal = new AbortController().signal
    expect(await obtenerProducto("id /?#", signal)).toEqual(producto)
    expect(fetch.mock.calls[0][0].pathname).toBe(
      "/api/v1/products/id%20%2F%3F%23"
    )
    expect(fetch.mock.calls[0][1]).toEqual({
      headers: { Accept: "application/json" },
      signal,
    })
  })

  it("distingue listado vacío, 404 y caída del backend", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(
        Response.json({
          data: [],
          meta: { ...paginaDto.meta, total: 0, totalPages: 0 },
        })
      )
      .mockResolvedValueOnce(
        Response.json(
          { statusCode: 404, message: "No existe" },
          { status: 404 }
        )
      )
      .mockResolvedValueOnce(new Response("Unavailable", { status: 503 }))
    vi.stubGlobal("fetch", fetch)
    expect((await listarProductos()).data).toEqual([])
    await expect(obtenerProducto("42")).rejects.toMatchObject({
      statusCode: 404,
    })
    await expect(obtenerProducto("42")).rejects.toBeInstanceOf(CatalogoApiError)
  })
})
