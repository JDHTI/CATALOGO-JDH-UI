import { beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"

import { MainNav } from "@/components/layout/main-nav"

const mocks = vi.hoisted(() => ({ useCategorias: vi.fn() }))
vi.mock("@/modules/catalogo/hooks/use-productos", () => ({
  useCategorias: mocks.useCategorias,
}))
vi.mock("@/components/layout/mega-menu", () => ({
  MegaMenu: () => null,
}))

beforeEach(() => {
  mocks.useCategorias.mockReturnValue({ data: [] })
})

function categoria(id: string, nombre: string, totalProductos: number) {
  return { id, slug: null, nombre, totalProductos, subcategorias: [] }
}

describe("accesos a categorías del header", () => {
  it("enlaza cada categoría con su filtro del catálogo", () => {
    mocks.useCategorias.mockReturnValue({
      data: [categoria("7", "Aseo", 20), categoria("3", "Menaje", 10)],
    })
    render(<MainNav />)
    expect(
      screen.getByRole("link", { name: "Aseo" }).getAttribute("href")
    ).toBe("/productos?categoria=7")
    expect(
      screen.getByRole("link", { name: "Menaje" }).getAttribute("href")
    ).toBe("/productos?categoria=3")
    expect(
      screen
        .getAllByRole("link")
        .some((link) => /marca=|marcas\//.test(link.getAttribute("href") ?? ""))
    ).toBe(false)
  })

  it("ordena por catálogo y ofrece como máximo diez, sin modificar los datos compartidos", () => {
    const categorias = Object.freeze(
      Array.from({ length: 12 }, (_, i) =>
        Object.freeze(categoria(String(i), `Categoria ${i}`, i))
      )
    )
    mocks.useCategorias.mockReturnValue({ data: categorias })
    render(<MainNav />)
    const enlaces = screen.getAllByRole("link", { name: /^Categoria/ })
    expect(enlaces.map((link) => link.textContent)).toEqual(
      Array.from({ length: 10 }, (_, i) => `Categoria ${11 - i}`)
    )
    expect(categorias[0].id).toBe("0")
  })

  it.each([undefined, []])(
    "mantiene la navegacion general sin categorías (%j)",
    (data) => {
      mocks.useCategorias.mockReturnValue({ data })
      render(<MainNav />)
      expect(
        screen.queryAllByRole("link", { name: /^Categoria/ })
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
