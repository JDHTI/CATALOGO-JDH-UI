import { describe, expect, it } from "vitest"

import { resolverApiBaseUrl } from "@/modules/catalogo/api/client"

describe("resolverApiBaseUrl", () => {
  it("usa la URL absoluta tal cual, en navegador y en servidor", () => {
    const abs = "https://api.example.com/api/v1"
    expect(resolverApiBaseUrl(abs, "http://192.168.100.218", undefined)).toBe(
      abs
    )
    expect(resolverApiBaseUrl(abs, undefined, "http://api:8080/api/v1")).toBe(
      abs
    )
  })

  it("sin configurar cae al API local de desarrollo", () => {
    expect(resolverApiBaseUrl(undefined, undefined, undefined)).toBe(
      "http://localhost:8080/api/v1"
    )
  })

  it("relativa: el navegador la cuelga del origen por el que entró", () => {
    expect(
      resolverApiBaseUrl(
        "/api/v1",
        "http://192.168.100.218",
        "http://api:8080/api/v1"
      )
    ).toBe("http://192.168.100.218/api/v1")
    expect(
      resolverApiBaseUrl("/api/v1", "https://tienda.jdh.local", undefined)
    ).toBe("https://tienda.jdh.local/api/v1")
  })

  it("relativa: el servidor va por la red interna", () => {
    expect(
      resolverApiBaseUrl("/api/v1", undefined, "http://api:8080/api/v1")
    ).toBe("http://api:8080/api/v1")
  })

  it("relativa sin BACKEND_API_URL en el servidor falla con un mensaje claro", () => {
    expect(() => resolverApiBaseUrl("/api/v1", undefined, undefined)).toThrow(
      /BACKEND_API_URL/
    )
  })
})
