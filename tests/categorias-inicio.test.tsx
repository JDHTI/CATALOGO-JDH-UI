import type { ReactNode } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"

import {
  ICONO_CATEGORIA_POR_DEFECTO,
  iconoCategoria,
} from "@/modules/catalogo/categorias"
import { CategoriasSection } from "@/modules/inicio/components/categorias-section"

const mocks = vi.hoisted(() => ({ useCategorias: vi.fn() }))
vi.mock("@/modules/catalogo/hooks/use-productos", () => ({
  useCategorias: mocks.useCategorias,
}))
vi.mock("@/components/motion/scroll-reveal", () => ({
  ScrollReveal: ({ children }: { children: ReactNode }) => (
    <div>{children}</div>
  ),
}))
vi.mock("@/components/motion/stagger", () => ({
  Stagger: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  StaggerItem: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}))

const categoria = (id: number, nombre: string, totalProductos: number) => ({
  id: String(id),
  slug: `cat-${id}`,
  nombre,
  totalProductos,
  subcategorias: [
    { id: `${id}1`, slug: "a", nombre: "Uno", totalProductos: 1 },
    { id: `${id}2`, slug: "b", nombre: "Dos", totalProductos: 1 },
  ],
})

describe("iconoCategoria", () => {
  it("resuelve por slug y cae al icono por defecto con uno desconocido", () => {
    expect(iconoCategoria("alimentos")).not.toBe(ICONO_CATEGORIA_POR_DEFECTO)
    expect(iconoCategoria("categoria-que-no-existe")).toBe(
      ICONO_CATEGORIA_POR_DEFECTO
    )
    // Un slug que coincide con una propiedad heredada de Object no cuenta.
    expect(iconoCategoria("constructor")).toBe(ICONO_CATEGORIA_POR_DEFECTO)
  })
})

describe("categorías destacadas del inicio", () => {
  beforeEach(() => {
    mocks.useCategorias.mockReturnValue({ data: undefined, isPending: false })
  })

  it("muestra las 9 de mayor volumen y enlaza cada una a su filtro", () => {
    mocks.useCategorias.mockReturnValue({
      data: Array.from({ length: 11 }, (_, i) =>
        categoria(i + 1, `Categoría ${i + 1}`, (i + 1) * 10)
      ),
      isPending: false,
    })
    render(<CategoriasSection />)
    const enlaces = screen.getAllByRole("link")
    expect(enlaces).toHaveLength(9)
    // Las dos más chicas (1 y 2) quedan fuera.
    expect(screen.queryByRole("link", { name: /Categoría 1\b/ })).toBeNull()
    expect(
      screen.getByRole("link", { name: /Categoría 11/ }).getAttribute("href")
    ).toBe("/productos?categoria=11")
  })

  it("se oculta si el API falla o no trae categorías", () => {
    const { container, rerender } = render(<CategoriasSection />)
    expect(container.firstChild).toBeNull()
    mocks.useCategorias.mockReturnValue({ data: [], isPending: false })
    rerender(<CategoriasSection />)
    expect(container.firstChild).toBeNull()
  })

  it("anuncia la carga con la misma grilla", () => {
    mocks.useCategorias.mockReturnValue({ data: undefined, isPending: true })
    render(<CategoriasSection />)
    expect(
      screen.getByRole("status", { name: "Cargando categorías" })
    ).toBeDefined()
    expect(screen.queryAllByRole("link")).toHaveLength(0)
  })
})
