import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { ListasView } from "@/modules/listas/components/listas-view"
import { producto } from "./producto-fixture"
import type { ReactNode } from "react"

const mocks = vi.hoisted(() => ({ add: vi.fn(), search: vi.fn() }))
vi.mock("@/components/common/page-header", () => ({ PageHeader: ({ children }: { children: ReactNode }) => <div>{children}</div> }))
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: vi.fn() }), useSearchParams: () => new URLSearchParams() }))
vi.mock("@/hooks/use-current-user", () => ({ useCurrentUser: () => ({ user: { id: "user-1" } }) }))
vi.mock("@/modules/catalogo/hooks/use-productos", () => ({ useBusquedaProductos: (...args: unknown[]) => mocks.search(...args) }))
vi.mock("@/modules/catalogo/components/producto-imagen", () => ({ ProductoImagen: () => null }))
vi.mock("@/modules/listas/hooks/use-listas", () => {
  const mutation = () => ({ isPending: false, error: null, mutate: vi.fn(), mutateAsync: mocks.add })
  return {
    useListas: () => ({ data: { data: [{ id: "list-1", name: "Pedido semanal", itemCount: 11 }], meta: { total: 1, maxLists: 10 } } }),
    useListaItems: () => ({ data: { data: Array.from({ length: 11 }, (_, index) => ({ productId: String(index), quantity: 1, createdAt: new Date(2026, 8, index + 1).toISOString(), updatedAt: new Date(2026, 8, 30 - index).toISOString(), productActive: true, product: { ...producto, id: String(index), nombre: `Guardado ${index + 1}` } })), meta: { total: 11 } } }),
    useCrearLista: mutation, useEliminarLista: mutation, useRenombrarLista: mutation,
    useEstablecerCantidad: mutation, useEliminarItem: mutation,
  }
})

describe("editor de pedidos", () => {
  beforeEach(() => {
    mocks.add.mockReset().mockResolvedValue({})
    mocks.search.mockReset().mockReturnValue({ data: { data: [{ ...producto, id: "new" }], meta: { page: 1, totalPages: 1 } } })
  })

  it("muestra cinco por página y desplaza los más antiguos a las siguientes", () => {
    render(<ListasView />)
    expect(screen.getAllByRole("spinbutton")).toHaveLength(5)
    expect(screen.getAllByRole("link").slice(1).map((link) => link.textContent)).toEqual([
      "Guardado 11", "Guardado 10", "Guardado 9", "Guardado 8", "Guardado 7",
    ])
    expect(screen.queryByText("Guardado 1")).toBeNull()
    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }))
    expect(screen.getAllByRole("spinbutton")).toHaveLength(5)
    expect(screen.getByText("Guardado 6")).toBeDefined()
    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }))
    expect(screen.getAllByRole("spinbutton")).toHaveLength(1)
    expect(screen.getByText("Guardado 1")).toBeDefined()
  })

  it("limpia y enfoca la búsqueda después de agregar el producto", async () => {
    render(<ListasView />)
    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }))
    const input = screen.getByPlaceholderText("Nombre o SKU exacto")
    fireEvent.change(input, { target: { value: "001-A" } })
    const add = await screen.findByRole("button", { name: "Agregar" })
    await waitFor(() => expect((add as HTMLButtonElement).disabled).toBe(false))
    fireEvent.change(screen.getByRole("spinbutton", { name: `Cantidad para agregar ${producto.nombre}` }), { target: { value: "12" } })
    fireEvent.click(add)
    await waitFor(() => expect((input as HTMLInputElement).value).toBe(""))
    expect(document.activeElement).toBe(input)
    expect(mocks.add).toHaveBeenCalledWith({ listaId: "list-1", productoId: "new", quantity: 12 })
    expect(screen.getByText("Página 1 de 3")).toBeDefined()
    expect(screen.queryByRole("combobox")).toBeNull()
  })

  it("impide agregar cantidades vacías, fraccionarias o fuera del límite", async () => {
    render(<ListasView />)
    fireEvent.change(screen.getByPlaceholderText("Nombre o SKU exacto"), { target: { value: "001-A" } })
    const add = await screen.findByRole("button", { name: "Agregar" })
    await waitFor(() => expect((add as HTMLButtonElement).disabled).toBe(false))
    const quantity = screen.getByRole("spinbutton", { name: `Cantidad para agregar ${producto.nombre}` })
    for (const value of ["", "0", "-1", "1.5", "2147483648"]) {
      fireEvent.change(quantity, { target: { value } })
      expect((add as HTMLButtonElement).disabled).toBe(true)
      fireEvent.click(add)
    }
    expect(mocks.add).not.toHaveBeenCalled()
  })

  it("conserva el texto si falla el guardado", async () => {
    mocks.add.mockRejectedValueOnce(new Error("API no disponible"))
    render(<ListasView />)
    const input = screen.getByPlaceholderText("Nombre o SKU exacto")
    fireEvent.change(input, { target: { value: "001-A" } })
    const add = await screen.findByRole("button", { name: "Agregar" })
    await waitFor(() => expect((add as HTMLButtonElement).disabled).toBe(false))
    fireEvent.click(add)
    await waitFor(() => expect(mocks.add).toHaveBeenCalled())
    expect((input as HTMLInputElement).value).toBe("001-A")
  })
})
