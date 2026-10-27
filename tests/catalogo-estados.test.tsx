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
  refetch: vi.fn(),
  replace: vi.fn(),
  query: "",
}))
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mocks.replace }),
  usePathname: () => "/productos",
  useSearchParams: () => new URLSearchParams(mocks.query),
}))
vi.mock("@/modules/catalogo/hooks/use-productos", () => ({
  useProductos: mocks.useProductos,
  useProveedores: () => ({ data: [] }),
  useMarcas: () => ({ data: [] }),
}))
vi.mock("@/modules/catalogo/components/catalog-banner-carousel", () => ({
  CatalogBannerCarousel: () => null,
}))
vi.mock("@/modules/catalogo/components/catalog-filters", () => ({
  CatalogFilters: () => null,
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
