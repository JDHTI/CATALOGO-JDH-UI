import { useState } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
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

const arbol = [
  {
    id: "1",
    slug: "alimentos",
    nombre: "Alimentos",
    totalProductos: 30,
    subcategorias: [
      { id: "11", slug: "granos", nombre: "Granos", totalProductos: 20 },
      { id: "12", slug: "salsas", nombre: "Salsas", totalProductos: 10 },
    ],
  },
  {
    id: "2",
    slug: "menaje",
    nombre: "Menaje",
    totalProductos: 8,
    subcategorias: [
      { id: "21", slug: "ollas", nombre: "Ollas", totalProductos: 8 },
    ],
  },
]

/** Reproduce lo que hace `CatalogoView`: cambiar de categoría limpia la sub. */
function FiltersConCategorias({
  categorias = arbol,
  pending = false,
  inicial = { categoria: [] as string[], sub: [] as string[] },
}: {
  /** `null` = la consulta no trajo datos (el default no aplica a `null`). */
  categorias?: typeof arbol | null
  pending?: boolean
  inicial?: { categoria: string[]; sub: string[] }
}) {
  const [categoria, setCategoria] = useState(inicial.categoria)
  const [sub, setSub] = useState(inicial.sub)
  return (
    <CatalogFilters
      categorias={categorias ?? undefined}
      categoriasPending={pending}
      categoriaIds={categoria}
      onCategoriaChange={(id) => {
        setCategoria(id)
        setSub([])
      }}
      subcategoriaIds={sub}
      onSubcategoriaChange={setSub}
      proveedores={[]}
      marcas={[]}
      proveedorIds={[]}
      onProveedorChange={() => {}}
      marcaIds={[]}
      onMarcaChange={() => {}}
      proveedoresPending={false}
      proveedoresError={false}
      onRetryProveedores={() => {}}
      marcasPending={false}
      marcasError={false}
      marcasNoImplementado={false}
      onRetryMarcas={() => {}}
      onLimpiar={() => {
        setCategoria([])
        setSub([])
      }}
    />
  )
}

describe("categorías y subcategorías", () => {
  it("muestra las categorías con su conteo y no muestra subcategorías hasta elegir una", () => {
    render(<FiltersConCategorias />)
    expect(
      screen.getByRole("button", { name: /^Alimentos\s*30$/ })
    ).toBeDefined()
    expect(screen.getByRole("button", { name: /^Menaje\s*8$/ })).toBeDefined()
    expect(screen.queryByText("Subcategorías")).toBeNull()
    expect(screen.queryByRole("button", { name: /Granos/ })).toBeNull()
  })

  it("al elegir una categoría aparecen solo sus subcategorías, con conteo", () => {
    render(<FiltersConCategorias />)
    fireEvent.click(screen.getByRole("button", { name: /^Alimentos/ }))
    expect(screen.getByText("Subcategorías")).toBeDefined()
    expect(screen.getByRole("button", { name: /^Granos\s*20$/ })).toBeDefined()
    expect(screen.getByRole("button", { name: /^Salsas\s*10$/ })).toBeDefined()
    expect(screen.queryByRole("button", { name: /Ollas/ })).toBeNull()
  })

  it("cambiar de categoría limpia la subcategoría elegida", () => {
    render(<FiltersConCategorias />)
    fireEvent.click(screen.getByRole("button", { name: /^Alimentos/ }))
    fireEvent.click(screen.getByRole("button", { name: /^Granos/ }))
    expect(
      screen.getByRole("button", { name: /^Granos/, pressed: true })
    ).toBeDefined()
    fireEvent.click(screen.getByRole("button", { name: /^Menaje/ }))
    expect(screen.queryByRole("button", { name: /Granos/ })).toBeNull()
    expect(screen.getByRole("button", { name: /^Ollas/ })).toBeDefined()
    expect(
      screen.getByRole("button", {
        name: "Todas las subcategorías",
        pressed: true,
      })
    ).toBeDefined()
  })

  it("deseleccionar la categoría oculta las subcategorías", () => {
    render(<FiltersConCategorias />)
    fireEvent.click(screen.getByRole("button", { name: /^Alimentos/ }))
    fireEvent.click(screen.getByRole("button", { name: /^Alimentos/ }))
    expect(screen.queryByText("Subcategorías")).toBeNull()
  })

  it("una subcategoría llegada sola por la URL muestra también su jerarquía", () => {
    render(<FiltersConCategorias inicial={{ categoria: [], sub: ["21"] }} />)
    expect(
      screen.getByRole("button", { name: /^Ollas/, pressed: true })
    ).toBeDefined()
    expect(screen.queryByRole("button", { name: /Granos/ })).toBeNull()
  })

  it("cuenta categoría y subcategoría como filtros activos y Limpiar los reinicia", () => {
    render(<FiltersConCategorias inicial={{ categoria: ["1"], sub: ["11"] }} />)
    expect(screen.getByText("2")).toBeDefined()
    fireEvent.click(screen.getByRole("button", { name: "Limpiar filtros" }))
    expect(
      screen.getByRole("button", {
        name: "Todas las categorías",
        pressed: true,
      })
    ).toBeDefined()
    expect(screen.queryByText("Subcategorías")).toBeNull()
  })

  it.each([
    ["sin datos (error o API anterior)", null],
    ["lista vacía", []],
  ])(
    "oculta la sección si las categorías vienen %s, sin romper el panel",
    (_, categorias) => {
      render(<FiltersConCategorias categorias={categorias} />)
      expect(screen.queryByText("Categorías")).toBeNull()
      expect(screen.queryByText("Todas las categorías")).toBeNull()
      expect(screen.getByText("Proveedores")).toBeDefined()
      expect(screen.getByText("Marcas")).toBeDefined()
    }
  )

  it("mientras carga muestra la sección sin opciones", () => {
    render(<FiltersConCategorias categorias={null} pending />)
    expect(screen.getByText("Categorías")).toBeDefined()
    expect(screen.queryByText("Todas las categorías")).toBeNull()
  })
})

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
