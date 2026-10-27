import { beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"

import { MainNav } from "@/components/layout/main-nav"

const mocks = vi.hoisted(() => ({ useMarcas: vi.fn() }))
vi.mock("@/modules/catalogo/hooks/use-productos", () => ({
  useMarcas: mocks.useMarcas,
}))
vi.mock("@/components/layout/mega-menu", () => ({
  MegaMenu: () => null,
}))

beforeEach(() => {
  mocks.useMarcas.mockReturnValue({ data: [] })
})

describe("accesos a marcas del header", () => {
  it("enlaza cada marca con su propio filtro, sin usar IDs de proveedores", () => {
    mocks.useMarcas.mockReturnValue({
      data: [
        {
          id: "85",
          slug: "marca-uno",
          nombre: "Marca Uno",
          totalProductos: 20,
        },
        { id: "42", slug: null, nombre: "Marca Dos", totalProductos: 10 },
      ],
    })
    render(<MainNav />)
    expect(
      screen.getByRole("link", { name: "Marca Uno" }).getAttribute("href")
    ).toBe("/marcas/marca-uno")
    expect(
      screen.getByRole("link", { name: "Marca Dos" }).getAttribute("href")
    ).toBe("/productos?marca=42")
    expect(
      screen
        .getAllByRole("link")
        .some((link) => link.getAttribute("href")?.includes("proveedor="))
    ).toBe(false)
  })

  it("muestra los ocho marcas con mayor catalogo sin modificar los datos compartidos", () => {
    const marcas = Object.freeze(
      Array.from({ length: 10 }, (_, i) =>
        Object.freeze({
          id: String(i),
          nombre: `Marca ${i}`,
          totalProductos: i,
        })
      )
    )
    mocks.useMarcas.mockReturnValue({ data: marcas })
    render(<MainNav />)
    const enlaces = screen.getAllByRole("link", { name: /^Marca/ })
    expect(enlaces.map((link) => link.textContent)).toEqual([
      "Marca 9",
      "Marca 8",
      "Marca 7",
      "Marca 6",
      "Marca 5",
      "Marca 4",
      "Marca 3",
      "Marca 2",
    ])
    expect(marcas[0].id).toBe("0")
  })

  it.each([undefined, []])(
    "mantiene la navegacion general sin marcas (%j)",
    (data) => {
      mocks.useMarcas.mockReturnValue({ data })
      render(<MainNav />)
      expect(screen.queryAllByRole("link", { name: /^Marca/ })).toHaveLength(0)
      expect(
        screen.getByRole("link", { name: /Explorar/ }).getAttribute("href")
      ).toBe("/productos")
      expect(
        screen.getByRole("link", { name: "Promociones" }).getAttribute("href")
      ).toBe("/productos?promocion=1")
    }
  )
})
