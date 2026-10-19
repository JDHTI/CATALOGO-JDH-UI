import { useState } from "react"
import { beforeEach, expect, it, vi } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"
import { CatalogFilters } from "@/modules/catalogo/components/catalog-filters"

beforeEach(() => {
  vi.stubGlobal("matchMedia", () => ({
    matches: true,
    addEventListener() {},
    removeEventListener() {},
  }))
})

function Filters() {
  const [suppliers, setSuppliers] = useState<string[]>([])
  const [brands, setBrands] = useState<string[]>([])
  return (
    <CatalogFilters
      proveedores={[
        { id: "1", nombre: "Proveedor A" },
        { id: "2", nombre: "Proveedor B" },
      ]}
      marcas={[
        { id: "3", slug: "marca-a", nombre: "Marca A" },
        { id: "4", slug: "marca-b", nombre: "Marca B" },
      ]}
      proveedorIds={suppliers}
      onProveedorChange={setSuppliers}
      marcaIds={brands}
      onMarcaChange={setBrands}
      proveedoresPending={false}
      proveedoresError={false}
      onRetryProveedores={() => {}}
      marcasPending={false}
      marcasError={false}
      marcasNoImplementado={false}
      onRetryMarcas={() => {}}
      onLimpiar={() => {
        setSuppliers([])
        setBrands([])
      }}
    />
  )
}

it("elegir otra opción reemplaza la anterior en vez de acumularla", () => {
  render(<Filters />)
  fireEvent.click(screen.getByRole("button", { name: "Proveedor A" }))
  fireEvent.click(screen.getByRole("button", { name: "Proveedor B" }))
  expect(
    screen.getByRole("button", { name: "Proveedor B", pressed: true })
  ).toBeDefined()
  expect(
    screen.getByRole("button", { name: "Proveedor A", pressed: false })
  ).toBeDefined()
})

it("pulsar la opción activa la quita, y limpiar reinicia ambos grupos", () => {
  render(<Filters />)
  for (const name of ["Proveedor A", "Marca A", "Marca B"]) {
    fireEvent.click(screen.getByRole("button", { name }))
  }
  // Una por eje: Marca B reemplazó a Marca A.
  expect(screen.getAllByRole("button", { pressed: true })).toHaveLength(2)
  fireEvent.click(screen.getByRole("button", { name: "Proveedor A" }))
  expect(
    screen.getByRole("button", { name: "Todos los proveedores", pressed: true })
  ).toBeDefined()
  fireEvent.click(screen.getByRole("button", { name: "Marca A" }))
  expect(
    screen.getByRole("button", { name: "Marca A", pressed: true })
  ).toBeDefined()
  fireEvent.click(screen.getByRole("button", { name: "Limpiar filtros" }))
  expect(
    screen.getByRole("button", { name: "Todos los proveedores", pressed: true })
  ).toBeDefined()
  expect(
    screen.getByRole("button", { name: "Todas las marcas", pressed: true })
  ).toBeDefined()
})
