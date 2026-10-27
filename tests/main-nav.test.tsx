import { beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"

import { MainNav } from "@/components/layout/main-nav"

const mocks = vi.hoisted(() => ({ useProveedores: vi.fn() }))
vi.mock("@/modules/catalogo/hooks/use-productos", () => ({
  useProveedores: mocks.useProveedores,
}))
vi.mock("@/components/layout/mega-menu", () => ({
  MegaMenu: () => null,
}))

beforeEach(() => {
  mocks.useProveedores.mockReturnValue({ data: [] })
})

describe("accesos a proveedores del header", () => {
  it("enlaza cada proveedor con su propio filtro, sin usar IDs de marcas", () => {
    mocks.useProveedores.mockReturnValue({
      data: [
        { id: "85", nombre: "Proveedor Uno", totalProductos: 20 },
        { id: "42", nombre: "Proveedor Dos", totalProductos: 10 },
      ],
    })
    render(<MainNav />)
    expect(
      screen.getByRole("link", { name: "Proveedor Uno" }).getAttribute("href")
    ).toBe("/productos?proveedor=85")
    expect(
      screen.getByRole("link", { name: "Proveedor Dos" }).getAttribute("href")
    ).toBe("/productos?proveedor=42")
    expect(
      screen
        .getAllByRole("link")
        .some((link) => link.getAttribute("href")?.includes("marca="))
    ).toBe(false)
  })

  it("muestra los ocho proveedores con mayor catalogo sin modificar los datos compartidos", () => {
    const proveedores = Object.freeze(
      Array.from({ length: 10 }, (_, i) =>
        Object.freeze({
          id: String(i),
          nombre: `Proveedor ${i}`,
          totalProductos: i,
        })
      )
    )
    mocks.useProveedores.mockReturnValue({ data: proveedores })
    render(<MainNav />)
    const enlaces = screen.getAllByRole("link", { name: /^Proveedor/ })
    expect(enlaces.map((link) => link.textContent)).toEqual([
      "Proveedor 9",
      "Proveedor 8",
      "Proveedor 7",
      "Proveedor 6",
      "Proveedor 5",
      "Proveedor 4",
      "Proveedor 3",
      "Proveedor 2",
    ])
    expect(proveedores[0].id).toBe("0")
  })

  it.each([undefined, []])(
    "mantiene la navegacion general sin proveedores (%j)",
    (data) => {
      mocks.useProveedores.mockReturnValue({ data })
      render(<MainNav />)
      expect(
        screen.queryAllByRole("link", { name: /^Proveedor/ })
      ).toHaveLength(0)
      expect(
        screen.getByRole("link", { name: /Explorar/ }).getAttribute("href")
      ).toBe("/productos")
      expect(
        screen.getByRole("link", { name: "Promociones" }).getAttribute("href")
      ).toBe("/productos?promocion=1")
    }
  )
})
