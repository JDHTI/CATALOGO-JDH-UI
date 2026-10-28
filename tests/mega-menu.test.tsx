import { beforeEach, expect, it, vi } from "vitest"
import { fireEvent, render, screen, within } from "@testing-library/react"
import { MegaMenu } from "@/components/layout/mega-menu"

const mocks = vi.hoisted(() => ({
  useCategorias: vi.fn(),
  useMarcas: vi.fn(),
  useProveedores: vi.fn(),
  refetch: vi.fn(),
}))
vi.mock("@/modules/catalogo/hooks/use-productos", () => ({
  useCategorias: mocks.useCategorias,
  useMarcas: mocks.useMarcas,
  useProveedores: mocks.useProveedores,
}))
vi.mock("@/hooks/use-current-user", () => ({
  useCurrentUser: () => ({ permissions: [] }),
}))
vi.mock("@/config/modules", () => ({
  modules: { visibleTo: () => [], byId: () => undefined },
}))

const subcategoria = (id: number, nombre: string) => ({
  id: String(id),
  slug: `sub-${id}`,
  nombre,
  totalProductos: 10,
})

beforeEach(() => {
  vi.clearAllMocks()
  mocks.useCategorias.mockReturnValue({
    data: [
      {
        id: "1",
        slug: "alimentos",
        nombre: "Alimentos",
        totalProductos: 100,
        subcategorias: [subcategoria(11, "Granos"), subcategoria(12, "Salsas")],
      },
      {
        // Slug sin icono en el mapa: debe pintarse con el icono por defecto.
        id: "2",
        slug: "categoria-nueva",
        nombre: "Categoría Nueva",
        totalProductos: 5,
        subcategorias: Array.from({ length: 9 }, (_, i) =>
          subcategoria(20 + i, `Sub ${i + 1}`)
        ),
      },
    ],
  })
  mocks.useMarcas.mockReturnValue({
    data: [
      { id: "10", slug: "marca-uno", nombre: "Marca Uno" },
      { id: "20", slug: null, nombre: "Marca Dos" },
    ],
  })
  mocks.useProveedores.mockReturnValue({
    data: [
      { id: "85", nombre: "Proveedor Uno" },
      { id: "42", nombre: "Proveedor Dos" },
    ],
  })
})

function abrir() {
  render(<MegaMenu />)
  const trigger = screen.getByRole("button", { name: /Men/ })
  fireEvent.click(trigger)
  return trigger
}

it("carga el catalogo al abrir y ofrece marcas y proveedores con destinos reales", () => {
  render(<MegaMenu />)
  expect(mocks.useProveedores).not.toHaveBeenCalled()
  fireEvent.click(screen.getByRole("button", { name: /Men/ }))
  const marcas = within(screen.getByRole("region", { name: "Marcas" }))
  expect(
    marcas.getByRole("link", { name: "Marca Uno" }).getAttribute("href")
  ).toBe("/marcas/marca-uno")
  expect(
    marcas.getByRole("link", { name: "Marca Dos" }).getAttribute("href")
  ).toBe("/productos?marca=20")
  const proveedores = within(
    screen.getByRole("region", { name: "Proveedores" })
  )
  expect(
    proveedores
      .getByRole("link", { name: "Proveedor Uno" })
      .getAttribute("href")
  ).toBe("/productos?proveedor=85")
  expect(
    proveedores
      .getByRole("link", { name: "Proveedor Dos" })
      .getAttribute("href")
  ).toBe("/productos?proveedor=42")
})

it("lista las categorías del API y enlaza cada una y sus subcategorías por id", () => {
  abrir()
  const categorias = within(screen.getByRole("region", { name: "Categorías" }))
  expect(
    categorias.getByRole("link", { name: "Alimentos" }).getAttribute("href")
  ).toBe("/productos?categoria=1")
  expect(
    categorias.getByRole("link", { name: "Granos" }).getAttribute("href")
  ).toBe("/productos?categoria=1&subcategoria=11")
  expect(
    categorias.getByRole("link", { name: "Salsas" }).getAttribute("href")
  ).toBe("/productos?categoria=1&subcategoria=12")
})

it("una categoría sin icono conocido sigue pintándose, y recorta sus subcategorías", () => {
  abrir()
  const categorias = within(screen.getByRole("region", { name: "Categorías" }))
  expect(
    categorias
      .getByRole("link", { name: "Categoría Nueva" })
      .getAttribute("href")
  ).toBe("/productos?categoria=2")
  // 6 visibles + enlace "ver todas" a la categoría.
  expect(categorias.getByRole("link", { name: "Sub 6" })).toBeDefined()
  expect(categorias.queryByRole("link", { name: "Sub 7" })).toBeNull()
  expect(
    categorias
      .getByRole("link", { name: "Ver las 9 subcategorías" })
      .getAttribute("href")
  ).toBe("/productos?categoria=2")
})

it.each([
  ["falla", { isError: true }],
  ["viene vacío", { data: [] }],
])(
  "omite las categorías si el API %s sin romper marcas ni proveedores",
  (_, estado) => {
    mocks.useCategorias.mockReturnValue(estado)
    abrir()
    expect(screen.queryByRole("region", { name: "Categorías" })).toBeNull()
    expect(screen.getByRole("region", { name: "Marcas" })).toBeDefined()
    expect(screen.getByRole("region", { name: "Proveedores" })).toBeDefined()
  }
)

it("anuncia la carga de categorías", () => {
  mocks.useCategorias.mockReturnValue({ isPending: true })
  abrir()
  expect(screen.getByText("Cargando categorías...")).toBeDefined()
})

it("cierra el menu al elegir una categoría", () => {
  const trigger = abrir()
  fireEvent.click(screen.getByRole("link", { name: "Alimentos" }))
  expect(trigger.getAttribute("aria-expanded")).toBe("false")
})

it("cierra el menu al elegir un proveedor", () => {
  const trigger = abrir()
  fireEvent.click(screen.getByRole("link", { name: "Proveedor Uno" }))
  expect(trigger.getAttribute("aria-expanded")).toBe("false")
  expect(screen.queryByRole("region", { name: "Proveedores" })).toBeNull()
})

it("cierra con Escape y devuelve el foco al trigger", () => {
  const trigger = abrir()
  screen.getByRole("link", { name: "Marca Uno" }).focus()
  fireEvent.keyDown(document, { key: "Escape" })
  expect(trigger.getAttribute("aria-expanded")).toBe("false")
  expect(document.activeElement).toBe(trigger)
})

it("distingue carga, error con reintento y lista vacia", () => {
  mocks.useMarcas.mockReturnValue({ isPending: true })
  mocks.useProveedores.mockReturnValue({
    isError: true,
    refetch: mocks.refetch,
  })
  abrir()
  expect(screen.getByText("Cargando marcas...")).toBeDefined()
  fireEvent.click(
    screen.getByRole("button", { name: "Reintentar proveedores" })
  )
  expect(mocks.refetch).toHaveBeenCalledOnce()
  expect(screen.queryByRole("link", { name: "Proveedor Uno" })).toBeNull()
})

it("no inventa enlaces cuando no hay marcas ni proveedores", () => {
  mocks.useMarcas.mockReturnValue({ data: [] })
  mocks.useProveedores.mockReturnValue({ data: [] })
  abrir()
  expect(screen.getByText("No hay marcas disponibles.")).toBeDefined()
  expect(screen.getByText("No hay proveedores disponibles.")).toBeDefined()
})
