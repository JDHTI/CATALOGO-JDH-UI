import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { Heart } from "lucide-react"

import { IconNavLink } from "@/components/layout/icon-nav-link"

/**
 * El contador del header tiene dos requisitos explícitos: tope de 99 con
 * "99+" al pasarse, y que el tamaño del ícono NO cambie con el número.
 */
describe("contador de favoritos en el header", () => {
  it("no dibuja badge sin favoritos", () => {
    const { container } = render(
      <IconNavLink href="/favoritos" icon={Heart} label="Favoritos" count={0} />
    )
    expect(container.querySelector("span[aria-hidden]")).toBeNull()
    // Sin conteo, la etiqueta no inventa un "(0)".
    expect(screen.getByLabelText("Favoritos")).toBeDefined()
  })

  it.each([
    [1, "1"],
    [9, "9"],
    [10, "10"],
    [99, "99"],
    [100, "99+"],
    [1500, "99+"],
  ])("con %i favoritos muestra %s", (count, esperado) => {
    const { container } = render(
      <IconNavLink
        href="/favoritos"
        icon={Heart}
        label="Favoritos"
        count={count}
      />
    )
    expect(container.querySelector("span[aria-hidden]")?.textContent).toBe(
      esperado
    )
  })

  it("anuncia el número EXACTO aunque el badge lo recorte", () => {
    render(
      <IconNavLink
        href="/favoritos"
        icon={Heart}
        label="Favoritos"
        count={1500}
      />
    )
    // El recorte es una restricción de espacio, no del dato: un lector de
    // pantalla debe oír 1500, no "99+".
    expect(screen.getByLabelText("Favoritos (1500)")).toBeDefined()
  })

  it("mantiene el tamaño del ícono y del área táctil con cualquier conteo", () => {
    const clases = [0, 5, 100].map((count) => {
      const { container, unmount } = render(
        <IconNavLink
          href="/favoritos"
          icon={Heart}
          label="Favoritos"
          count={count}
        />
      )
      const enlace = container.querySelector("a")
      const svg = container.querySelector("svg")
      const resultado = `${enlace?.className} | ${svg?.getAttribute("class")}`
      unmount()
      return resultado
    })

    // El badge está posicionado en absoluto, así que ni el enlace ni el ícono
    // cambian de clases (y por tanto de tamaño) cuando aparece el número.
    expect(new Set(clases).size).toBe(1)
    expect(clases[0]).toContain("size-9")
    expect(clases[0]).toContain("size-5")
  })
})
