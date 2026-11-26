import { act } from "react"
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest"

import { fireEvent, render, screen } from "./render-con-providers"

import { ProductoCard } from "@/modules/catalogo/components/producto-card"
import { VISTA_PREVIA_DELAY_MS } from "@/modules/catalogo/components/producto-vista-previa"
import { producto } from "./producto-fixture"

/**
 * jsdom no implementa `PointerEvent`, y sin él `fireEvent.pointerX` crea un
 * `Event` genérico que no lleva `pointerType`: la vista previa lo descartaría
 * como si fuera táctil. Basta un `MouseEvent` que acepte ese campo.
 */
beforeAll(() => {
  if (typeof window.PointerEvent === "undefined") {
    class PointerEventFalso extends MouseEvent {
      pointerType: string
      constructor(tipo: string, init: PointerEventInit = {}) {
        super(tipo, init)
        this.pointerType = init.pointerType ?? ""
      }
    }
    // @ts-expect-error -- polyfill mínimo solo para pruebas
    window.PointerEvent = PointerEventFalso
  }
})

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

function contenedorDeLaCard() {
  return screen.getByRole("article").parentElement!
}

describe("vista previa de producto", () => {
  it("no se abre antes de que el ratón descanse VISTA_PREVIA_DELAY_MS sobre la card", () => {
    render(<ProductoCard producto={producto} />)
    fireEvent.pointerEnter(contenedorDeLaCard(), { pointerType: "mouse" })

    act(() => {
      vi.advanceTimersByTime(VISTA_PREVIA_DELAY_MS - 100)
    })
    expect(screen.queryByRole("dialog")).toBeNull()

    act(() => {
      vi.advanceTimersByTime(100)
    })
    expect(screen.getByRole("dialog", { name: producto.nombre })).toBeDefined()
    expect(
      screen.getByRole("link", { name: /Ver detalle/ }).getAttribute("href")
    ).toBe("/productos/42")
  })

  it("salir de la card antes de tiempo cancela la apertura", () => {
    render(<ProductoCard producto={producto} />)
    const card = contenedorDeLaCard()
    fireEvent.pointerEnter(card, { pointerType: "mouse" })
    act(() => {
      vi.advanceTimersByTime(VISTA_PREVIA_DELAY_MS - 300)
    })
    fireEvent.pointerLeave(card, { pointerType: "mouse" })
    act(() => {
      vi.advanceTimersByTime(VISTA_PREVIA_DELAY_MS)
    })
    expect(screen.queryByRole("dialog")).toBeNull()
  })

  it("en táctil no se abre: el tap sigue navegando", () => {
    render(<ProductoCard producto={producto} />)
    fireEvent.pointerEnter(contenedorDeLaCard(), { pointerType: "touch" })
    act(() => {
      vi.advanceTimersByTime(VISTA_PREVIA_DELAY_MS * 2)
    })
    expect(screen.queryByRole("dialog")).toBeNull()
  })

  it("se cierra con Esc y no se reabre hasta salir de la card", () => {
    render(<ProductoCard producto={producto} />)
    const card = contenedorDeLaCard()
    fireEvent.pointerEnter(card, { pointerType: "mouse" })
    act(() => {
      vi.advanceTimersByTime(VISTA_PREVIA_DELAY_MS)
    })
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" })
    expect(screen.queryByRole("dialog")).toBeNull()

    fireEvent.pointerEnter(card, { pointerType: "mouse" })
    act(() => {
      vi.advanceTimersByTime(VISTA_PREVIA_DELAY_MS)
    })
    expect(screen.queryByRole("dialog")).toBeNull()
  })
})
