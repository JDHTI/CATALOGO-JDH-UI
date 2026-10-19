import { describe, expect, it } from "vitest"

import {
  barajar,
  elegirCeldas,
  rotarCelda,
} from "@/modules/inicio/hooks/use-tablero"
import {
  nombreDesdeSlug,
  parsearMarcas,
} from "@/modules/inicio/schemas/manifiesto-marcas"

describe("rotación del tablero de marcas", () => {
  it("cambia la celda por la cabeza de la cola y manda la saliente al final", () => {
    expect(rotarCelda(["a", "b", "c", "d", "e"], 2, 1)).toEqual([
      "a",
      "c",
      "d",
      "e",
      "b",
    ])
  })

  it("nunca repite un elemento visible y recorre todo el pool", () => {
    const pool = Array.from({ length: 73 }, (_, i) => i)
    const visibles = 20
    let orden = pool
    const vistos = new Set(orden.slice(0, visibles))

    for (let tick = 0; tick < 40; tick++) {
      for (const celda of elegirCeldas(visibles, 3)) {
        orden = rotarCelda(orden, visibles, celda)
      }
      const enPantalla = orden.slice(0, visibles)
      expect(new Set(enPantalla).size).toBe(visibles)
      enPantalla.forEach((n) => vistos.add(n))
    }

    expect(orden.slice().sort((a, b) => a - b)).toEqual(pool)
    expect(vistos.size).toBe(pool.length)
  })

  it("no rota si el pool cabe entero o la celda está oculta", () => {
    const orden = ["a", "b", "c"]
    expect(rotarCelda(orden, 3, 0)).toBe(orden)
    expect(rotarCelda(["a", "b", "c", "d"], 2, 3)).toEqual(["a", "b", "c", "d"])
  })

  it("elige celdas distintas, visibles y fuera del tick anterior", () => {
    for (let i = 0; i < 50; i++) {
      const celdas = elegirCeldas(12, 3, [0, 1, 2])
      expect(new Set(celdas).size).toBe(3)
      celdas.forEach((c) => {
        expect(c).toBeGreaterThanOrEqual(3)
        expect(c).toBeLessThan(12)
      })
    }
  })

  it("baraja sin perder ni duplicar elementos", () => {
    const lista = Array.from({ length: 30 }, (_, i) => i)
    expect(barajar(lista).sort((a, b) => a - b)).toEqual(lista)
  })
})

describe("manifiesto de marcas", () => {
  it("descarta entradas inválidas sin tumbar la lista", () => {
    expect(
      parsearMarcas([
        { slug: "alpina", logo: "https://cdn.test/brands/alpina/logo-1.webp" },
        { slug: "", logo: "https://cdn.test/x.webp" },
        { slug: "rota" },
        "basura",
      ])
    ).toEqual([
      { slug: "alpina", logo: "https://cdn.test/brands/alpina/logo-1.webp" },
    ])
  })

  it("conserva la marca del catálogo y descarta una inválida sin perder el logo", () => {
    const logo = "https://cdn.test/brands/alpina/logo-1.webp"
    const [conMarca, marcaRota] = parsearMarcas([
      {
        slug: "alpina",
        logo,
        marca: { id: 7, slug: "alpina", nombre: "ALPINA" },
      },
      { slug: "alpina", logo, marca: { slug: "Con Espacios", nombre: "X" } },
    ])
    expect(conMarca.marca).toEqual({ slug: "alpina", nombre: "ALPINA" })
    expect(marcaRota).toEqual({ slug: "alpina", logo, marca: undefined })
  })

  it("deriva el nombre de la marca desde el slug", () => {
    expect(nombreDesdeSlug("harinera-del-valle")).toBe("Harinera del Valle")
    expect(nombreDesdeSlug("3m")).toBe("3M")
    expect(nombreDesdeSlug("mdc")).toBe("MDC")
    expect(nombreDesdeSlug("nestle")).toBe("Nestlé")
    expect(nombreDesdeSlug("friend-chips")).toBe("Friend Chips")
  })
})
