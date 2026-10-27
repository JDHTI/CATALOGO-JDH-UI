import { beforeEach, expect, it, vi } from "vitest"
import { fireEvent, render, screen, within } from "@testing-library/react"
import { MegaMenu } from "@/components/layout/mega-menu"

const mocks = vi.hoisted(() => ({
  useMarcas: vi.fn(),
  useProveedores: vi.fn(),
  refetch: vi.fn(),
}))
vi.mock("@/modules/catalogo/hooks/use-productos", () => ({
  useMarcas: mocks.useMarcas,
  useProveedores: mocks.useProveedores,
}))
vi.mock("@/hooks/use-current-user", () => ({
  useCurrentUser: () => ({ permissions: [] }),
}))
vi.mock("@/config/modules", () => ({
  modules: { visibleTo: () => [], byId: () => undefined },
}))

beforeEach(() => {
  vi.clearAllMocks()
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
  expect(screen.queryByText(/Categor/)).toBeNull()
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
