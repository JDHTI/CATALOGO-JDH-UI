import { afterEach, beforeEach, expect, it, vi } from "vitest"
import { act, fireEvent, render, screen, within } from "@testing-library/react"
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

const subcategoria = (id: number, nombre: string, totalProductos = 10) => ({
  id: String(id),
  slug: `sub-${id}`,
  nombre,
  totalProductos,
})

beforeEach(() => {
  vi.clearAllMocks()
  // Viewport móvil: el toque en una categoría solo abre su panel. En `md+` el
  // clic navega (ver el test del enlace de la categoría).
  vi.stubGlobal("matchMedia", () => ({ matches: false }))
  mocks.useCategorias.mockReturnValue({
    data: [
      {
        id: "1",
        slug: "alimentos",
        nombre: "Alimentos",
        totalProductos: 1200,
        subcategorias: [
          subcategoria(11, "Granos", 50),
          subcategoria(12, "Salsas", 90),
          subcategoria(13, "Lácteos", 70),
          subcategoria(14, "Snacks", 60),
          subcategoria(15, "Conservas", 5),
        ],
      },
      {
        // Slug sin icono en el mapa: debe pintarse con el icono por defecto.
        id: "2",
        slug: "categoria-nueva",
        nombre: "Categoría Nueva",
        totalProductos: 5,
        subcategorias: [subcategoria(21, "Única")],
      },
    ],
  })
  mocks.useMarcas.mockReturnValue({
    data: [
      { id: "10", slug: "marca-uno", nombre: "Marca Uno", totalProductos: 5 },
      { id: "20", slug: null, nombre: "Marca Dos", totalProductos: 50 },
    ],
  })
  mocks.useProveedores.mockReturnValue({
    data: [
      { id: "85", nombre: "Proveedor Uno" },
      { id: "42", nombre: "Proveedor Dos" },
    ],
  })
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

function abrir() {
  render(<MegaMenu />)
  const trigger = screen.getByRole("button", { name: /Men/ })
  fireEvent.click(trigger)
  return trigger
}

const pestana = (nombre: string | RegExp) =>
  screen.getByRole("tab", { name: nombre })
const panel = () => within(screen.getByRole("tabpanel"))

it("no carga el catálogo hasta abrir; luego muestra la primera categoría sin scroll de listas", () => {
  render(<MegaMenu />)
  expect(mocks.useProveedores).not.toHaveBeenCalled()
  fireEvent.click(screen.getByRole("button", { name: /Men/ }))
  // Categorías + Marcas + Proveedores como pestañas de UNA lista.
  expect(screen.getAllByRole("tab").map((tab) => tab.textContent)).toEqual([
    "Alimentos",
    "Categoría Nueva",
    "Marcas",
    "Proveedores",
  ])
  expect(pestana("Alimentos").getAttribute("aria-selected")).toBe("true")
  expect(panel().getByRole("heading", { name: "Alimentos" })).toBeDefined()
})

it("el panel enlaza la categoría completa y sus subcategorías por id", () => {
  abrir()
  expect(
    panel()
      .getByRole("link", { name: /Ver todo en Alimentos/ })
      .getAttribute("href")
  ).toBe("/productos?categoria=1")
  expect(
    panel()
      .getByRole("link", { name: /Granos/ })
      .getAttribute("href")
  ).toBe("/productos?categoria=1&subcategoria=11")
})

it("destaca las 3 subcategorías con más productos y deja el resto aparte", () => {
  abrir()
  const destacadas = within(
    screen.getByRole("region", { name: "Destacadas de Alimentos" })
  )
  expect(destacadas.getAllByRole("link").map((l) => l.textContent)).toEqual([
    "Salsas90 productos",
    "Lácteos70 productos",
    "Snacks60 productos",
  ])
  const resto = within(
    screen.getByRole("region", { name: "Más subcategorías de Alimentos" })
  )
  expect(resto.getAllByRole("link").map((l) => l.textContent)).toEqual([
    "Granos",
    "Conservas",
  ])
})

it("una categoría con pocas subcategorías solo tiene destacadas", () => {
  abrir()
  fireEvent.click(pestana("Categoría Nueva"))
  expect(panel().getByRole("link", { name: /Única/ })).toBeDefined()
  expect(screen.queryByRole("region", { name: /Más subcategorías/ })).toBeNull()
})

it("cada categoría de la lista es un enlace a su categoría completa", () => {
  abrir()
  expect(pestana("Alimentos").getAttribute("href")).toBe(
    "/productos?categoria=1"
  )
  expect(pestana("Categoría Nueva").getAttribute("href")).toBe(
    "/productos?categoria=2"
  )
  // Marcas y Proveedores no tienen destino propio: siguen siendo botones.
  expect(pestana("Marcas").getAttribute("href")).toBeNull()
})

it("en móvil el toque en una categoría no navega: solo abre su panel", () => {
  abrir()
  const noCancelado = fireEvent.click(pestana("Categoría Nueva"))
  expect(noCancelado).toBe(false)
  expect(pestana("Categoría Nueva").getAttribute("aria-selected")).toBe("true")
})

it("elegir una pestaña cambia el panel", () => {
  abrir()
  fireEvent.click(pestana("Categoría Nueva"))
  expect(pestana("Categoría Nueva").getAttribute("aria-selected")).toBe("true")
  expect(pestana("Alimentos").getAttribute("aria-selected")).toBe("false")
  expect(
    panel().getByRole("heading", { name: "Categoría Nueva" })
  ).toBeDefined()
  expect(panel().queryByRole("link", { name: /Granos/ })).toBeNull()
})

it("navega entre pestañas con flechas, Inicio y Fin, y solo la activa es parada de Tab", () => {
  abrir()
  const activa = pestana("Alimentos")
  activa.focus()
  expect(activa.tabIndex).toBe(0)
  expect(pestana("Marcas").tabIndex).toBe(-1)

  fireEvent.keyDown(activa, { key: "ArrowDown" })
  expect(pestana("Categoría Nueva").getAttribute("aria-selected")).toBe("true")
  expect(document.activeElement).toBe(pestana("Categoría Nueva"))

  fireEvent.keyDown(pestana("Categoría Nueva"), { key: "End" })
  expect(document.activeElement).toBe(pestana("Proveedores"))
  // Circular: desde la última vuelve a la primera.
  fireEvent.keyDown(pestana("Proveedores"), { key: "ArrowDown" })
  expect(document.activeElement).toBe(pestana("Alimentos"))
  fireEvent.keyDown(pestana("Alimentos"), { key: "ArrowUp" })
  expect(document.activeElement).toBe(pestana("Proveedores"))
  fireEvent.keyDown(pestana("Proveedores"), { key: "Home" })
  expect(document.activeElement).toBe(pestana("Alimentos"))
})

it("el hover con ratón cambia la pestaña tras una pausa, y salir antes la cancela", () => {
  vi.useFakeTimers()
  abrir()
  fireEvent.pointerEnter(pestana("Categoría Nueva"), { pointerType: "mouse" })
  fireEvent.pointerLeave(pestana("Categoría Nueva"), { pointerType: "mouse" })
  act(() => void vi.advanceTimersByTime(200))
  expect(pestana("Alimentos").getAttribute("aria-selected")).toBe("true")

  fireEvent.pointerEnter(pestana("Categoría Nueva"), { pointerType: "mouse" })
  act(() => void vi.advanceTimersByTime(200))
  expect(pestana("Categoría Nueva").getAttribute("aria-selected")).toBe("true")
})

it("el toque no activa pestañas por hover", () => {
  vi.useFakeTimers()
  abrir()
  fireEvent.pointerEnter(pestana("Categoría Nueva"), { pointerType: "touch" })
  act(() => void vi.advanceTimersByTime(200))
  expect(pestana("Alimentos").getAttribute("aria-selected")).toBe("true")
})

it("ofrece marcas y proveedores con destinos reales, de más a menos productos", () => {
  abrir()
  fireEvent.click(pestana("Marcas"))
  const marcas = panel()
  expect(marcas.getAllByRole("link").map((l) => l.textContent)).toEqual([
    "Ver todos los productos",
    "Marca Dos",
    "Marca Uno",
  ])
  expect(
    marcas.getByRole("link", { name: "Marca Uno" }).getAttribute("href")
  ).toBe("/marcas/marca-uno")
  expect(
    marcas.getByRole("link", { name: "Marca Dos" }).getAttribute("href")
  ).toBe("/productos?marca=20")

  fireEvent.click(pestana("Proveedores"))
  expect(
    panel().getByRole("link", { name: "Proveedor Uno" }).getAttribute("href")
  ).toBe("/productos?proveedor=85")
  expect(
    panel().getByRole("link", { name: "Proveedor Dos" }).getAttribute("href")
  ).toBe("/productos?proveedor=42")
})

it("recorta marcas a las que caben sin scroll y avisa del resto", () => {
  mocks.useMarcas.mockReturnValue({
    data: Array.from({ length: 25 }, (_, i) => ({
      id: String(i),
      slug: `m-${i}`,
      nombre: `Marca ${i}`,
      totalProductos: 100 - i,
    })),
  })
  abrir()
  fireEvent.click(pestana("Marcas"))
  // 18 marcas + el enlace "Ver todos los productos".
  expect(panel().getAllByRole("link")).toHaveLength(19)
  expect(panel().getByText(/7 más/)).toBeDefined()
})

it("cierra el menu al elegir un destino", () => {
  const trigger = abrir()
  fireEvent.click(panel().getByRole("link", { name: /Ver todo en Alimentos/ }))
  expect(trigger.getAttribute("aria-expanded")).toBe("false")
  expect(screen.queryByRole("tabpanel")).toBeNull()
})

it("cierra con Escape y devuelve el foco al trigger", () => {
  const trigger = abrir()
  pestana("Alimentos").focus()
  fireEvent.keyDown(document, { key: "Escape" })
  expect(trigger.getAttribute("aria-expanded")).toBe("false")
  expect(document.activeElement).toBe(trigger)
})

it("si las categorías fallan o vienen vacías, el menú sigue con marcas y proveedores", () => {
  for (const estado of [{ isError: true }, { data: [] }]) {
    mocks.useCategorias.mockReturnValue(estado)
    const { unmount } = render(<MegaMenu />)
    fireEvent.click(screen.getByRole("button", { name: /Men/ }))
    expect(screen.getAllByRole("tab").map((t) => t.textContent)).toEqual([
      "Marcas",
      "Proveedores",
    ])
    // Con la lista de categorías ausente, manda la primera pestaña que queda.
    expect(pestana("Marcas").getAttribute("aria-selected")).toBe("true")
    unmount()
  }
})

it("anuncia la carga de categorías", () => {
  mocks.useCategorias.mockReturnValue({ isPending: true })
  abrir()
  expect(screen.getByText("Cargando categorías...")).toBeDefined()
})

it("distingue carga, error con reintento y lista vacia en marcas y proveedores", () => {
  mocks.useMarcas.mockReturnValue({ isPending: true })
  mocks.useProveedores.mockReturnValue({
    isError: true,
    refetch: mocks.refetch,
  })
  abrir()
  fireEvent.click(pestana("Marcas"))
  expect(screen.getByText("Cargando marcas...")).toBeDefined()
  fireEvent.click(pestana("Proveedores"))
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
  fireEvent.click(pestana("Marcas"))
  expect(screen.getByText("No hay marcas disponibles.")).toBeDefined()
  fireEvent.click(pestana("Proveedores"))
  expect(screen.getByText("No hay proveedores disponibles.")).toBeDefined()
})

it("en móvil el botón de volver regresa de una categoría a la lista", () => {
  abrir()
  fireEvent.click(pestana("Categoría Nueva"))
  const volver = screen.getByRole("button", { name: "Volver a categorías" })
  fireEvent.click(volver)
  // Sigue elegida la misma pestaña; solo cambia qué vista se muestra.
  expect(pestana("Categoría Nueva").getAttribute("aria-selected")).toBe("true")
})
