// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("server-only", () => ({}))

const cabeceras = vi.hoisted(() => ({ valor: new Headers() }))
vi.mock("next/headers", () => ({ headers: async () => cabeceras.valor }))

import {
  aCuerpoApi,
  contactoSchema,
  normalizarCelular,
} from "@/modules/inicio/schemas/contacto"
import { enviarContacto } from "@/modules/inicio/server/acciones"

const valido = {
  nombre: "  María Restrepo ",
  correo: "Compras@Empresa.COM",
  celular: "+57 300 123 4567",
  ciudad: "Medellín",
  tipoIdentificacion: "NIT",
  identificacion: "900.123.456-7",
  aceptaTratamientoDatos: true,
}

const fetchMock = vi.fn()

beforeEach(() => {
  vi.stubEnv("BACKEND_API_URL", "http://api.test/api/v1")
  vi.stubGlobal("fetch", fetchMock)
  fetchMock.mockReset()
  fetchMock.mockResolvedValue(Response.json({ ok: true }, { status: 201 }))
  cabeceras.valor = new Headers({
    "x-forwarded-for": "10.0.0.5, 190.25.1.2",
    "user-agent": "Prueba/1.0",
  })
  vi.spyOn(console, "error").mockImplementation(() => {})
})
afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe("esquema de contacto", () => {
  it("normaliza celular, correo, nombre e identificación", () => {
    const datos = contactoSchema.parse(valido)
    expect(datos).toMatchObject({
      nombre: "María Restrepo",
      correo: "compras@empresa.com",
      celular: "3001234567",
      identificacion: "900123456-7",
    })
  })

  it.each([
    ["3001234567", "3001234567"],
    ["(300) 123-4567", "3001234567"],
    ["573001234567", "3001234567"],
  ])("celular %s → %s", (entrada, salida) => {
    expect(normalizarCelular(entrada)).toBe(salida)
  })

  it("la identificación es opcional: vacía viaja como null", () => {
    const datos = contactoSchema.parse({
      ...valido,
      tipoIdentificacion: "",
      identificacion: " ",
    })
    expect(datos.tipoIdentificacion).toBeNull()
    expect(datos.identificacion).toBeNull()
  })

  it.each([
    [{ aceptaTratamientoDatos: false }, "aceptaTratamientoDatos"],
    [{ celular: "6044448018" }, "celular"],
    [{ correo: "no-es-correo" }, "correo"],
    [
      { tipoIdentificacion: "", identificacion: "123456" },
      "tipoIdentificacion",
    ],
    [{ tipoIdentificacion: "CC", identificacion: "" }, "identificacion"],
    [
      { tipoIdentificacion: "CC", identificacion: "1234567-8" },
      "identificacion",
    ],
  ])("rechaza %j en %s", (cambio, campo) => {
    const resultado = contactoSchema.safeParse({ ...valido, ...cambio })
    expect(resultado.success).toBe(false)
    expect(resultado.error?.issues[0].path[0]).toBe(campo)
  })

  it("el cuerpo para el API lleva exactamente los ocho campos del contrato", () => {
    const cuerpo = aCuerpoApi(contactoSchema.parse(valido))
    expect(Object.keys(cuerpo).sort()).toEqual(
      [
        "aceptaTratamientoDatos",
        "celular",
        "ciudad",
        "correo",
        "identificacion",
        "nombre",
        "origen",
        "tipoIdentificacion",
      ].sort()
    )
    expect(cuerpo.origen).toBe("home-newsletter")
  })
})

describe("enviarContacto", () => {
  it("envía al API con la IP del visitante y responde ok", async () => {
    await expect(enviarContacto(valido)).resolves.toEqual({ ok: true })
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe("http://api.test/api/v1/contact-leads")
    expect(init.method).toBe("POST")
    expect(init.headers).toMatchObject({
      "X-Forwarded-For": "190.25.1.2",
      "User-Agent": "Prueba/1.0",
    })
    expect(JSON.parse(init.body)).toMatchObject({
      celular: "3001234567",
      origen: "home-newsletter",
    })
  })

  it("con datos inválidos devuelve errores por campo sin llamar al API", async () => {
    const resultado = await enviarContacto({
      ...valido,
      aceptaTratamientoDatos: false,
      ciudad: "",
    })
    expect(resultado.ok).toBe(false)
    if (resultado.ok) return
    expect(resultado.errores).toMatchObject({
      aceptaTratamientoDatos: expect.any(String),
      ciudad: expect.any(String),
    })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("el campo trampa lleno responde éxito sin enviar nada", async () => {
    await expect(
      enviarContacto({ ...valido, sitioWeb: "http://spam.test" })
    ).resolves.toEqual({ ok: true })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("un 429 del API se traduce en un mensaje de esperar", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 429 }))
    const resultado = await enviarContacto(valido)
    expect(resultado).toMatchObject({
      ok: false,
      mensaje: expect.stringMatching(/minutos/),
    })
  })

  it.each([
    [
      "un 400 del API",
      () => fetchMock.mockResolvedValue(new Response("{}", { status: 400 })),
    ],
    [
      "el API caído",
      () => fetchMock.mockRejectedValue(new TypeError("fetch failed")),
    ],
  ])("%s da un mensaje genérico", async (_, preparar) => {
    preparar()
    const resultado = await enviarContacto(valido)
    expect(resultado).toMatchObject({
      ok: false,
      mensaje: expect.stringMatching(/más tarde/),
    })
  })
})
