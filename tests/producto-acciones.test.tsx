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
it("respeta la disponibilidad de favoritos y no promete un carrito operativo", () => {
  mocks.useEsFavorito.mockReturnValue({ activo: false, esFavorito: false })
  render(<ProductoAcciones producto={producto} />)
  expect(
    screen.getByRole("button", { name: /Favoritos no disponibles/ })
  ).toBeDefined()
  expect(
    (
      screen.getByRole("button", {
        name: "Agregar al carrito",
      }) as HTMLButtonElement
    ).disabled
  ).toBe(true)
  expect(
    (screen.getByRole("spinbutton", { name: "Cantidad" }) as HTMLInputElement)
      .disabled
  ).toBe(true)
})
