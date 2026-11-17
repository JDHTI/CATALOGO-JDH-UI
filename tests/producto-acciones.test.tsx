import { beforeEach, expect, it, vi } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"
import { ProductoAcciones } from "@/modules/catalogo/components/producto-acciones"
import { producto } from "./producto-fixture"

const mocks = vi.hoisted(() => ({ mutate: vi.fn(), useEsFavorito: vi.fn() }))
vi.mock("@/modules/favoritos/hooks/use-favoritos", () => ({
  useEsFavorito: mocks.useEsFavorito,
  useAlternarFavorito: () => ({ mutate: mocks.mutate }),
}))
beforeEach(() => {
  vi.clearAllMocks()
  mocks.useEsFavorito.mockReturnValue({ activo: true, esFavorito: false })
})
it.each([false, true])(
  "alterna favoritos desde la ficha (guardado: %s)",
  (esFavorito) => {
    mocks.useEsFavorito.mockReturnValue({ activo: true, esFavorito })
    render(<ProductoAcciones producto={producto} />)
    const boton = screen.getByRole("button", {
      name: new RegExp(esFavorito ? "Quitar.*favoritos" : "Agregar.*favoritos"),
    })
    expect(boton.getAttribute("aria-pressed")).toBe(String(esFavorito))
    fireEvent.click(boton)
    expect(mocks.mutate).toHaveBeenCalledWith({
      productoId: producto.id,
      esFavorito,
    })
  }
)
it("sin precio de empleado (anónimo, cliente o fuera de la lista) no ofrece carrito", () => {
  mocks.useEsFavorito.mockReturnValue({ activo: false, esFavorito: false })
  for (const precioEmpleado of [undefined, null]) {
    const { unmount } = render(
      <ProductoAcciones producto={{ ...producto, precioEmpleado }} />
    )
    expect(
      screen.getByRole("button", { name: /Favoritos no disponibles/ })
    ).toBeDefined()
    expect(screen.queryByRole("button", { name: /carrito/i })).toBeNull()
    expect(screen.queryByRole("spinbutton")).toBeNull()
    unmount()
  }
})
