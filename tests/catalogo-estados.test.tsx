import type { ReactNode } from "react"
import { beforeEach, expect, it, vi } from "vitest"
// Con providers: la card monta `FavoritoBoton`, que usa TanStack Query igual
// que en la app. Ver `render-con-providers`.
import { fireEvent, render, screen } from "./render-con-providers"

import {
  CatalogoView,
  CatalogoViewFallback,
} from "@/modules/catalogo/components/catalogo-view"
import { producto } from "./producto-fixture"

const mocks = vi.hoisted(() => ({
  useProductos: vi.fn(),
  useCategorias: vi.fn(),
  refetch: vi.fn(),
  replace: vi.fn(),
  filtros: vi.fn(),
  query: "",
}))
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mocks.replace }),
  usePathname: () => "/productos",
  useSearchParams: () => new URLSearchParams(mocks.query),
}))
vi.mock("@/modules/catalogo/hooks/use-productos", () => ({
  useProductos: mocks.useProductos,
  useCategorias: mocks.useCategorias,
  useProveedores: () => ({ data: [] }),
  useMarcas: () => ({ data: [] }),
}))
vi.mock("@/modules/catalogo/components/catalog-banner-carousel", () => ({
  CatalogBannerCarousel: () => null,
}))
vi.mock("@/modules/catalogo/components/catalog-filters", () => ({
  // Expone los props al test: aquí se verifica el cableado de la vista (URL ↔
  // consultas ↔ handlers), no el panel, que tiene su propia prueba.
  CatalogFilters: (props: unknown) => {
    mocks.filtros(props)
    return null
  },
}))
vi.mock("@/modules/catalogo/components/productos-vitrina", () => ({
  DestacadosCatalogo: () => null,
}))
vi.mock("@/components/motion/stagger", () => ({
  Stagger: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  StaggerItem: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}))

beforeEach(() => {
  mocks.query = ""
  // Sin esto, un `replace` de una prueba anterior daría por buena la
  // aserción de la siguiente.
  mocks.replace.mockClear()
  mocks.filtros.mockClear()
  mocks.useCategorias.mockReturnValue({ data: [], isPending: false })
  mocks.useProductos.mockReturnValue({
    isPending: false,
    isError: false,
    refetch: mocks.refetch,
  })
})

it("anuncia el fallback de Suspense y la carga inicial", () => {
  const { unmount } = render(<CatalogoViewFallback />)
  expect(
    screen.getByRole("status", { name: "Cargando productos" })
  ).toBeDefined()
  unmount()
  mocks.useProductos.mockReturnValue({ isPending: true })
  render(<CatalogoView />)
  expect(screen.getByText("Cargando productos…")).toBeDefined()
  expect(screen.queryByText("Sin resultados")).toBeNull()
})

it("distingue vacío editorial de catálogo vacío", () => {
  mocks.useProductos.mockReturnValue({
    data: {
      data: [
        {
          ...producto,
          descripcionLarga: null,
          seo: { title: null, description: null },
        },
      ],
    },
  })
  render(<CatalogoView />)
  expect(screen.getByText(producto.nombre)).toBeDefined()
  expect(screen.queryByText("Sin resultados")).toBeNull()
})

it("muestra vacío real sin productos inventados", () => {
  render(<CatalogoView />)
  expect(
    screen.getByText("El catálogo está vacío en este momento.")
  ).toBeDefined()
  expect(screen.queryByText(producto.nombre)).toBeNull()
})

it("permite limpiar una búsqueda sin resultados", () => {
  mocks.query = "q=inexistente&pagina=2"
  render(<CatalogoView />)
  fireEvent.click(
    screen.getByRole("button", { name: "Limpiar búsqueda y filtros" })
  )
  expect(mocks.replace).toHaveBeenCalledWith("/productos", { scroll: false })
})

it("muestra error con reintento y oculta paginación anterior", () => {
  mocks.useProductos.mockReturnValue({
    isError: true,
    refetch: mocks.refetch,
    data: {
      data: [producto],
      meta: { page: 1, limit: 12, total: 36, totalPages: 3 },
    },
  })
  render(<CatalogoView />)
  expect(screen.getByText("No pudimos cargar el catálogo")).toBeDefined()
  expect(screen.queryByText(producto.nombre)).toBeNull()
  expect(screen.queryByRole("navigation", { name: /paginación/i })).toBeNull()
  fireEvent.click(screen.getByRole("button", { name: /Reintentar/ }))
  expect(mocks.refetch).toHaveBeenCalledOnce()
})

it("restaura selecciones multiples desde la URL", () => {
  mocks.query = "proveedor=1,2&marca=3&marca=4&pagina=2"
  render(<CatalogoView />)
  expect(mocks.useProductos).toHaveBeenLastCalledWith(
    expect.objectContaining({
      supplierIds: ["1", "2"],
      brandIds: ["3", "4"],
      page: 2,
    })
  )
})

it("aplica a la consulta el proveedor recibido desde el enlace del header", () => {
  mocks.query = "proveedor=85"
  render(<CatalogoView />)
  expect(mocks.useProductos).toHaveBeenLastCalledWith(
    expect.objectContaining({ supplierIds: ["85"] })
  )
})

const ultimosFiltros = () =>
  mocks.filtros.mock.lastCall![0] as {
    categoriaIds: string[]
    subcategoriaIds: string[]
    onCategoriaChange: (id: string[]) => void
    onSubcategoriaChange: (id: string[]) => void
    onLimpiar: () => void
  }

it("restaura categoría y subcategoría desde la URL y las manda al API", () => {
  mocks.query = "categoria=1&subcategoria=5,6&pagina=3"
  render(<CatalogoView />)
  expect(mocks.useProductos).toHaveBeenLastCalledWith(
    expect.objectContaining({
      categoryIds: ["1"],
      subcategoryIds: ["5", "6"],
      page: 3,
    })
  )
  expect(ultimosFiltros()).toMatchObject({
    categoriaIds: ["1"],
    subcategoriaIds: ["5", "6"],
  })
})

it("sin categoría en la URL no manda filtros de categoría", () => {
  render(<CatalogoView />)
  const params = mocks.useProductos.mock.lastCall![0]
  expect(params.categoryIds).toBeUndefined()
  expect(params.subcategoryIds).toBeUndefined()
})

it("pide los conteos de categorías acotados a proveedor y marca activos", () => {
  mocks.query = "proveedor=85&marca=3"
  render(<CatalogoView />)
  expect(mocks.useCategorias).toHaveBeenLastCalledWith({
    supplierIds: ["85"],
    brandIds: ["3"],
  })
})

it("sin proveedor ni marca pide el árbol sin acotar", () => {
  render(<CatalogoView />)
  expect(mocks.useCategorias).toHaveBeenLastCalledWith({})
})

it("cambiar de categoría limpia la subcategoría y reinicia la paginación", () => {
  mocks.query = "categoria=1&subcategoria=5&pagina=4&q=arroz"
  render(<CatalogoView />)
  ultimosFiltros().onCategoriaChange(["2"])
  expect(mocks.replace).toHaveBeenCalledWith("/productos?categoria=2&q=arroz", {
    scroll: false,
  })
})

it("elegir subcategoría conserva la categoría y reinicia la paginación", () => {
  mocks.query = "categoria=1&pagina=4"
  render(<CatalogoView />)
  ultimosFiltros().onSubcategoriaChange(["5"])
  expect(mocks.replace).toHaveBeenCalledWith(
    "/productos?categoria=1&subcategoria=5",
    { scroll: false }
  )
})

it("quitar la categoría quita también la subcategoría", () => {
  mocks.query = "categoria=1&subcategoria=5"
  render(<CatalogoView />)
  ultimosFiltros().onCategoriaChange([])
  expect(mocks.replace).toHaveBeenCalledWith("/productos", { scroll: false })
})

it("limpiar filtros descarta categoría y subcategoría junto con proveedor y marca", () => {
  mocks.query = "categoria=1&subcategoria=5&proveedor=2&marca=3&q=arroz"
  render(<CatalogoView />)
  ultimosFiltros().onLimpiar()
  // La búsqueda no es un filtro del panel: se conserva.
  expect(mocks.replace).toHaveBeenCalledWith("/productos?q=arroz", {
    scroll: false,
  })
})

it("una categoría activa cuenta como filtro: el vacío ofrece limpiarla", () => {
  mocks.query = "categoria=1"
  render(<CatalogoView />)
  expect(
    screen.getByText(
      "Ningún producto coincide con la búsqueda o los filtros seleccionados."
    )
  ).toBeDefined()
})
