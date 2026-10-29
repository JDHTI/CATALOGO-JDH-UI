import { describe, expect, it, vi } from "vitest"
// Con providers: la card y la ficha montan `FavoritoBoton`, que usa TanStack
// Query igual que en la app. Ver `render-con-providers`.
import {
  fireEvent,
  render,
  renderToStaticMarkup,
  screen,
} from "./render-con-providers"

import { ProductoDescripcion } from "@/modules/catalogo/components/producto-descripcion"
import { ProductoCard } from "@/modules/catalogo/components/producto-card"
import { ProductoDetalleView } from "@/modules/catalogo/components/producto-detalle-view"
import { ProductoImagen } from "@/modules/catalogo/components/producto-imagen"
import Loading from "@/app/(catalogo)/productos/[id]/loading"
import NotFound from "@/app/(catalogo)/productos/[id]/not-found"
import ErrorView from "@/app/(catalogo)/productos/[id]/error"
import { producto } from "./producto-fixture"
import { productoMetadata } from "@/modules/catalogo/seo"

describe("contenido visible y seguro", () => {
  it("renderiza párrafos de texto plano con saltos y caracteres españoles", () => {
    const { container } = render(
      <ProductoDescripcion
        texto={"  Café & té.\r\nLínea siguiente.\r\n\r\nPresentación.  "}
      />
    )
    expect(container.querySelectorAll("p")).toHaveLength(2)
    expect(container.querySelector("p")?.textContent).toBe(
      "Café & té.\r\nLínea siguiente."
    )
  })

  it.each([null, "", " \r\n "])(
    "no inventa una sección editorial para %j",
    (texto) => {
      expect(renderToStaticMarkup(<ProductoDescripcion texto={texto} />)).toBe(
        ""
      )
    }
  )

  it("escapa HTML hostil en el servidor y en el navegador", () => {
    const attack =
      '<img src=x onerror="alert(1)"><script>alert(1)</script><a href="javascript:alert(1)">X</a>'
    const html = renderToStaticMarkup(<ProductoDescripcion texto={attack} />)
    expect(html).toContain("&lt;img")
    const { container } = render(<ProductoDescripcion texto={attack} />)
    expect(container.querySelector("img, script, a")).toBeNull()
    expect(screen.getByText(attack)).toBeDefined()
  })

  it("incluye la descripción larga en el HTML inicial de la ficha", () => {
    const html = renderToStaticMarkup(
      <ProductoDetalleView producto={producto} />
    )
    expect(html).toContain("Primer párrafo editorial.")
    expect(html).toContain("Segundo párrafo editorial.")
    expect(html).toContain("SKU")
    expect(html).not.toContain("68450362")
    expect(html).toContain("Fabricante de prueba")
    expect(html).toContain(producto.sku)
  })

  it("conserva una ficha utilizable sin editorial, marca ni imagen", () => {
    render(
      <ProductoDetalleView
        producto={{
          ...producto,
          descripcionLarga: null,
          seo: { title: null, description: null },
          marca: "",
          imagenUrl: null,
          imagenUrlFallback: null,
          imagenes: [],
        }}
      />
    )
    expect(
      screen.getByRole("heading", { level: 1, name: producto.nombre })
    ).toBeDefined()
    expect(
      screen.queryByRole("region", { name: "Descripción del producto" })
    ).toBeNull()
    expect(screen.getByText("Imagen próximamente")).toBeDefined()
  })

  it("mantiene la identificación de la card sin reutilizar el SEO ni la descripción larga", () => {
    const { rerender } = render(<ProductoCard producto={producto} />)
    expect(screen.queryByText(producto.seo.description!)).toBeNull()
    expect(screen.queryByText(/Primer párrafo editorial/)).toBeNull()
    expect(screen.getByText(producto.sku)).toBeDefined()
    expect(screen.getByRole("link").getAttribute("href")).toBe("/productos/42")
    rerender(
      <ProductoCard
        producto={{ ...producto, seo: { title: null, description: null } }}
      />
    )
    expect(screen.queryByText(producto.seo.description!)).toBeNull()
    expect(screen.queryByText("68450362")).toBeNull()
    expect(screen.getByText(producto.nombre)).toBeDefined()
  })

  it("mantiene los textos de Colpapel en detalle y metadatos, fuera de las tarjetas", () => {
    const colpapel = {
      ...producto,
      nombre: "Dispensador Papel Higienico Scott 7689",
      sku: "21945",
      descripcionLarga:
        "La referencia Dispensador de papel higiénico Scott 7689 de Scott corresponde a un sistema dispensador para organizar la entrega de insumos de higiene en baños y espacios institucionales.",
      seo: {
        title: "Dispensador de papel higiénico Scott 7689 | JDH",
        description:
          "Consulta Dispensador de papel higiénico Scott 7689 de Scott. dispensador para higiene institucional. Disponibilidad en JDH.",
      },
    }
    const { container, unmount } = render(<ProductoCard producto={colpapel} />)
    expect(container.textContent).not.toMatch(
      /Consulta|Disponibilidad en JDH|La referencia/
    )
    expect(screen.getByText(colpapel.nombre)).toBeDefined()
    expect(screen.getByText(colpapel.sku)).toBeDefined()
    unmount()

    render(<ProductoDetalleView producto={colpapel} />)
    expect(screen.getByText(colpapel.descripcionLarga)).toBeDefined()
    expect(productoMetadata(colpapel)).toMatchObject({
      description: colpapel.seo.description,
      openGraph: { description: colpapel.seo.description },
      twitter: { description: colpapel.seo.description },
    })
  })
})

describe("carga, ausencia y errores del detalle", () => {
  it("anuncia la carga sin contenido editorial provisional", () => {
    render(<Loading />)
    expect(
      screen.getByRole("status", { name: "Cargando producto" })
    ).toBeDefined()
    expect(screen.queryByText(producto.nombre)).toBeNull()
  })

  it("ofrece volver al catálogo en un 404 sin reintento inútil", () => {
    render(<NotFound />)
    expect(screen.getByText("Producto no encontrado")).toBeDefined()
    expect(
      screen
        .getByRole("link", { name: /Volver a productos/ })
        .getAttribute("href")
    ).toBe("/productos")
    expect(screen.queryByRole("button")).toBeNull()
  })

  it("reintenta con la API retry de Next 16.3 sin exponer el error interno", () => {
    const retry = vi.fn()
    render(
      <ErrorView error={new Error("Detalle interno privado")} retry={retry} />
    )
    expect(screen.getByRole("alert")).toBeDefined()
    expect(screen.queryByText("Detalle interno privado")).toBeNull()
    fireEvent.click(screen.getByRole("button", { name: /Reintentar/ }))
    expect(retry).toHaveBeenCalledOnce()
  })
})

describe("compatibilidad de imágenes", () => {
  it("pasa de variante full a imagenUrl, fallback y finalmente placeholder", () => {
    render(
      <ProductoImagen producto={producto} variant="detalle" sizes="100vw" />
    )
    const expectImage = (url: string) =>
      expect(
        decodeURIComponent(screen.getByRole("img").getAttribute("src")!)
      ).toContain(url)
    expectImage(producto.imagenes[0].fullUrl)
    fireEvent.error(screen.getByRole("img"))
    expectImage(producto.imagenUrl!)
    fireEvent.error(screen.getByRole("img"))
    expectImage(producto.imagenUrlFallback!)
    fireEvent.error(screen.getByRole("img"))
    expect(screen.queryByRole("img")).toBeNull()
    expect(screen.getByText("Imagen próximamente")).toBeDefined()
  })

  it("muestra la nueva URL al cambiar de producto después de un fallo", () => {
    const initial = { ...producto, imagenUrlFallback: null, imagenes: [] }
    const { rerender } = render(
      <ProductoImagen producto={initial} sizes="100vw" />
    )
    fireEvent.error(screen.getByRole("img"))
    expect(screen.queryByRole("img")).toBeNull()
    rerender(
      <ProductoImagen
        producto={{
          ...initial,
          imagenUrl: "https://images.example.com/other.webp",
        }}
        sizes="100vw"
      />
    )
    expect(screen.getByRole("img")).toBeDefined()
  })
})
