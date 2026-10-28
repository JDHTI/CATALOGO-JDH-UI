import { afterEach, describe, expect, it, vi } from "vitest"

import {
  buscarProductos,
  listarCategorias,
  listarDestacados,
  listarProductos,
  obtenerProducto,
} from "@/modules/catalogo/api/client"
import { CatalogoApiError } from "@/modules/catalogo/api/errors"
import { aProducto, productoDtoSchema } from "@/modules/catalogo/schemas/api"
import { paginaDto, producto, productoDto } from "./producto-fixture"

afterEach(() => vi.unstubAllGlobals())

describe("búsqueda unificada por nombre o SKU", () => {
  it("prioriza el SKU exacto y conserva ceros iniciales y separadores", async () => {
    const fetch = vi.fn().mockResolvedValue(Response.json(paginaDto))
    vi.stubGlobal("fetch", fetch)
    expect((await buscarProductos({ search: " 001-A/02 " })).data).toEqual([producto])
    expect(fetch).toHaveBeenCalledTimes(1)
    expect(fetch.mock.calls[0][0].searchParams.get("search")).toBe("001-A/02")
    expect(fetch.mock.calls[0][0].searchParams.get("searchMode")).toBe("skuExact")
  })

  it("busca por nombre cuando no hay coincidencia exacta y conserva la página", async () => {
    const fetch = vi.fn()
      .mockResolvedValueOnce(Response.json({ ...paginaDto, data: [], meta: { ...paginaDto.meta, total: 0 } }))
      .mockResolvedValueOnce(Response.json(paginaDto))
    vi.stubGlobal("fetch", fetch)
    expect((await buscarProductos({ search: "arroz", page: 2, limit: 8 })).data).toEqual([producto])
    expect(fetch.mock.calls[1][0].searchParams.get("searchMode")).toBe("name")
    expect(fetch.mock.calls[1][0].searchParams.get("page")).toBe("2")
  })

  it("no trata un fallo del API como ausencia del SKU", async () => {
    const fetch = vi.fn().mockResolvedValue(Response.json({ message: "No disponible" }, { status: 503 }))
    vi.stubGlobal("fetch", fetch)
    await expect(buscarProductos({ search: "001" })).rejects.toThrow()
    expect(fetch).toHaveBeenCalledTimes(1)
  })
})

describe("contrato editorial progresivo", () => {
  it("conserva los campos editoriales y todos los campos existentes", () => {
    const { descripcion, ...dtoSinRenombrar } = productoDto
    expect(producto).toEqual({
      ...dtoSinRenombrar,
      // El DTO lo llama `descripcion`; el dominio, `referencia`.
      referencia: descripcion,
      id: "42",
      // Pedido al API y aún no publicado: el fixture no lo trae.
      marcaId: null,
      proveedor: {
        id: "7",
        nombre: productoDto.proveedor.nombre,
        logoUrl: null,
      },
      categoria: {
        id: "8",
        nombre: productoDto.categoria.nombre,
        slug: "categoria-de-prueba",
      },
    })
  })

  it("lee slug de categoría y subcategoría, y tolera un API sin slug o sin categorizar", () => {
    const conSub = aProducto(
      productoDtoSchema.parse({
        ...productoDto,
        subcategoria: { id: 9, nombre: "Sub de prueba", slug: "sub-de-prueba" },
      })
    )
    expect(conSub.subcategoria).toEqual({
      id: "9",
      nombre: "Sub de prueba",
      slug: "sub-de-prueba",
    })

    // API anterior a la categorización: `{ id, nombre }` sin slug.
    const sinSlug = aProducto(
      productoDtoSchema.parse({
        ...productoDto,
        categoria: { id: 8, nombre: "Vieja" },
      })
    )
    expect(sinSlug.categoria).toEqual({ id: "8", nombre: "Vieja", slug: null })

    // Producto pendiente de categorizar.
    const pendiente = aProducto(
      productoDtoSchema.parse({
        ...productoDto,
        categoria: null,
        subcategoria: null,
      })
    )
    expect(pendiente.categoria).toBeNull()
    expect(pendiente.subcategoria).toBeNull()
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

it("envia todos los filtros multiples y conserva la paginacion", async () => {
  const fetch = vi.fn().mockResolvedValue(Response.json(paginaDto))
  vi.stubGlobal("fetch", fetch)
  await listarProductos({ supplierIds: ["1", "2"], brandIds: ["3", "4"], page: 2 })
  const params = fetch.mock.calls[0][0].searchParams
  expect(params.get("supplierIds")).toBe("1,2")
  expect(params.get("brandIds")).toBe("3,4")
  expect(params.get("page")).toBe("2")
})

it("envia los filtros de categoría y subcategoría y omite los vacíos", async () => {
  // Una `Response` nueva por llamada: su cuerpo solo se puede leer una vez.
  const fetch = vi.fn().mockImplementation(async () => Response.json(paginaDto))
  vi.stubGlobal("fetch", fetch)
  await listarProductos({
    categoryIds: ["1", "2"],
    subcategoryIds: ["5"],
    categoryId: "3",
    subcategoryId: "6",
  })
  const params = fetch.mock.calls[0][0].searchParams
  expect(params.get("categoryIds")).toBe("1,2")
  expect(params.get("subcategoryIds")).toBe("5")
  expect(params.get("categoryId")).toBe("3")
  expect(params.get("subcategoryId")).toBe("6")

  await listarProductos({ page: 1 })
  const sinFiltros = fetch.mock.calls[1][0].searchParams
  expect(sinFiltros.has("categoryIds")).toBe(false)
  expect(sinFiltros.has("subcategoryIds")).toBe(false)
})

describe("árbol de categorías", () => {
  const arbolDto = [
    {
      id: 1,
      slug: "alimentos",
      nombre: "Alimentos",
      totalProductos: 3295,
      subcategorias: [
        {
          id: 1,
          slug: "salsas-condimentos-y-bases",
          nombre: "Salsas, condimentos y bases",
          totalProductos: 868,
        },
      ],
    },
  ]

  it("lo valida, normaliza ids a string y acota los conteos con proveedor y marca", async () => {
    const fetch = vi.fn().mockResolvedValue(Response.json(arbolDto))
    vi.stubGlobal("fetch", fetch)
    const signal = new AbortController().signal
    const categorias = await listarCategorias(
      { supplierIds: ["1", "2"], brandIds: ["3"] },
      signal
    )
    expect(categorias).toEqual([
      {
        ...arbolDto[0],
        id: "1",
        subcategorias: [{ ...arbolDto[0].subcategorias[0], id: "1" }],
      },
    ])
    const url = fetch.mock.calls[0][0]
    expect(url.pathname).toBe("/api/v1/categories")
    expect(url.searchParams.get("supplierIds")).toBe("1,2")
    expect(url.searchParams.get("brandIds")).toBe("3")
    expect(fetch.mock.calls[0][1].signal).toBe(signal)
  })

  it("sin parámetros pide el árbol completo", async () => {
    const fetch = vi.fn().mockResolvedValue(Response.json([]))
    vi.stubGlobal("fetch", fetch)
    expect(await listarCategorias()).toEqual([])
    expect([...fetch.mock.calls[0][0].searchParams.keys()]).toEqual([])
  })

  it("rechaza un árbol malformado y propaga el 404 de un API anterior", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(Response.json([{ id: 1, nombre: "Sin slug" }]))
      .mockResolvedValueOnce(
        Response.json({ statusCode: 404, message: "No" }, { status: 404 })
      )
    vi.stubGlobal("fetch", fetch)
    await expect(listarCategorias()).rejects.toThrow()
    await expect(listarCategorias()).rejects.toMatchObject({ statusCode: 404 })
  })
})
