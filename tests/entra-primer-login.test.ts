// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

/**
 * Regresión del primer login de Entra en producción: la sesión recién creada
 * no traía `empleado` durante los 5 minutos de `session.cookieCache`, así que
 * el catálogo no pedía precios de empleado.
 *
 * Recorre el flujo REAL de Better Auth (`signInSocial` → `/callback/microsoft`)
 * con las opciones REALES de `src/lib/auth/server.ts`; solo cambian la base
 * (adaptador en memoria) y la red de Microsoft (`fetch` simulado). La sesión se
 * lee con la cookie de caché, que es exactamente lo que vería
 * `getCurrentUser()` y el `useSession()` del navegador.
 */

vi.mock("server-only", () => ({}))

const TENANT = "00000000-0000-4000-8000-00000000a1d0"
vi.hoisted(() => {
  // `server.ts` y `tenant.ts` las exigen al importarse. La base es un host
  // inexistente a propósito: el pool de `pg` no conecta hasta la primera
  // consulta, y aquí todas van al adaptador en memoria.
  Object.assign(process.env, {
    DATABASE_URL: "postgres://prueba:prueba@127.0.0.1:1/prueba",
    BETTER_AUTH_SECRET: "secreto-de-pruebas-de-al-menos-32-caracteres",
    BETTER_AUTH_URL: "http://localhost:3000",
    AUTH_MICROSOFT_ENTRA_ID_ID: "client-id-pruebas",
    AUTH_MICROSOFT_ENTRA_ID_SECRET: "client-secret-pruebas",
    AUTH_MICROSOFT_ENTRA_ID_TENANT_ID: "00000000-0000-4000-8000-00000000a1d0",
  })
})

import { betterAuth } from "better-auth"
import { memoryAdapter } from "better-auth/adapters/memory"

import { auth } from "@/lib/auth/server"

const BASE = "http://localhost:3000/api/auth"

/** JWT sin firmar: el proveedor de Microsoft solo DECODIFICA el id token. */
function idToken(claims: Record<string, unknown>): string {
  const parte = (o: object) =>
    Buffer.from(JSON.stringify(o)).toString("base64url")
  return `${parte({ alg: "none", typ: "JWT" })}.${parte(claims)}.firma`
}

function crearAuthDePrueba() {
  const db: Record<string, unknown[]> = {
    user: [],
    session: [],
    account: [],
    verification: [],
    rateLimit: [],
  }
  const prueba = betterAuth({
    ...auth.options,
    database: memoryAdapter(db),
    // Los plugins (jwt, customSession, nextCookies) no intervienen en la
    // creación de la sesión y el de jwt exigiría su propia tabla.
    plugins: [],
    rateLimit: { enabled: false },
  })
  return { prueba, db }
}

/** `Set-Cookie` → cabecera `Cookie` (solo nombre=valor). */
function cookiesDe(respuesta: Response, previas = ""): string {
  const nuevas = respuesta.headers
    .getSetCookie()
    .map((c) => c.split(";")[0])
    .filter((c) => !c.endsWith("="))
  return [previas, ...nuevas].filter(Boolean).join("; ")
}

/** Login completo con Entra; devuelve las cookies de la sesión creada. */
async function loginConEntra(
  prueba: ReturnType<typeof crearAuthDePrueba>["prueba"],
  claims: Record<string, unknown>
): Promise<string> {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (entrada: string | URL | Request) => {
      const url = entrada instanceof Request ? entrada.url : String(entrada)
      if (url.includes("/oauth2/v2.0/token")) {
        return Response.json({
          access_token: "access-token",
          id_token: idToken(claims),
          token_type: "Bearer",
          expires_in: 3600,
        })
      }
      // Foto de Graph: deshabilitada en la config, pero el proveedor la pide.
      return new Response(null, { status: 404 })
    })
  )

  const inicio = await prueba.handler(
    new Request(`${BASE}/sign-in/social`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: "http://localhost:3000",
      },
      body: JSON.stringify({ provider: "microsoft", callbackURL: "/" }),
    })
  )
  expect(inicio.status).toBe(200)
  const { url } = (await inicio.json()) as { url: string }
  const state = new URL(url).searchParams.get("state")!

  const callback = await prueba.handler(
    new Request(`${BASE}/callback/microsoft?code=codigo&state=${state}`, {
      headers: { cookie: cookiesDe(inicio) },
    })
  )
  expect(callback.status).toBe(302)
  expect(callback.headers.get("location")).not.toMatch(/error/)
  return cookiesDe(callback)
}

const claimsAna = {
  sub: "pairwise-ana",
  oid: "oid-ana",
  tid: TENANT,
  name: "Ana Empleada",
  email: "ana@jdh.com.co",
  roles: [],
}

beforeEach(() => vi.spyOn(console, "error").mockImplementation(() => {}))
afterEach(() => vi.unstubAllGlobals())

describe("primer login de Entra", () => {
  it("la cookie de la sesión NUEVA ya trae empleado=true (usuario nuevo)", async () => {
    const { prueba } = crearAuthDePrueba()
    const cookies = await loginConEntra(prueba, claimsAna)
    // La caché de sesión (`session_data`) es la que se lee primero.
    expect(cookies).toMatch(/session_data=/)

    const sesion = await prueba.api.getSession({
      headers: new Headers({ cookie: cookies }),
    })
    expect(sesion?.user.empleado).toBe(true)
  })

  it("también si la cuenta existía SIN la marca (creada antes de la migración)", async () => {
    const { prueba, db } = crearAuthDePrueba()
    await loginConEntra(prueba, claimsAna)
    // Simula una fila anterior al campo: la marca no está puesta.
    for (const u of db.user as { empleado?: boolean }[]) u.empleado = false

    const cookies = await loginConEntra(prueba, claimsAna)
    const sesion = await prueba.api.getSession({
      headers: new Headers({ cookie: cookies }),
    })
    expect(sesion?.user.empleado).toBe(true)
  })

  it("una cuenta de cliente (correo y contraseña) nunca queda marcada", async () => {
    const { prueba } = crearAuthDePrueba()
    const registro = await prueba.handler(
      new Request(`${BASE}/sign-up/email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "http://localhost:3000",
        },
        body: JSON.stringify({
          email: "cliente@example.com",
          password: "Clave-De-Prueba-2026!",
          name: "Cliente",
        }),
      })
    )
    expect(registro.status).toBe(200)
    const sesion = await prueba.api.getSession({
      headers: new Headers({ cookie: cookiesDe(registro) }),
    })
    expect(sesion?.user.empleado).not.toBe(true)
  })
})

describe("la configuración de la que depende el arreglo", () => {
  it("Entra reescribe el usuario en cada login (sin esto la cookie usaría la fila vieja)", () => {
    expect(
      auth.options.socialProviders?.microsoft?.overrideUserInfoOnSignIn
    ).toBe(true)
  })
})
