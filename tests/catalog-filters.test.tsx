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
        { id: "3", nombre: "Marca A" },
        { id: "4", nombre: "Marca B" },
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

it("permite combinar opciones, deseleccionar una y limpiar ambos grupos", () => {
  render(<Filters />)
  for (const name of ["Proveedor A", "Proveedor B", "Marca A", "Marca B"]) {
    fireEvent.click(screen.getByRole("button", { name }))
  }
  expect(screen.getAllByRole("button", { pressed: true })).toHaveLength(4)
  fireEvent.click(screen.getByRole("button", { name: "Proveedor A" }))
  expect(
    screen.getByRole("button", { name: "Proveedor B", pressed: true })
  ).toBeDefined()
  fireEvent.click(screen.getByRole("button", { name: "Todos los proveedores" }))
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
