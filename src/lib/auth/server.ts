import "server-only"

import { betterAuth } from "better-auth"
import type { BetterAuthOptions } from "better-auth"
import { nextCookies } from "better-auth/next-js"
import { customSession } from "better-auth/plugins"
import { Pool } from "pg"

import {
  normalizeRoles,
  permissionsForRoles,
  ROLES,
} from "@/config/permissions"

import { assertJdhTenant, JDH_TENANT_ID } from "./tenant"

/**
 * Bypass temporal para despliegues de solo maqueta — ver el mismo bypass y su
 * justificación en `./tenant.ts`. Nada de esto conecta de verdad: `DATABASE_URL`
 * placeholder nunca abre una conexión real (el `pool.on("error")` de abajo
 * la absorbe) y `BETTER_AUTH_SECRET`/credenciales de Entra placeholder solo
 * evitan que el import de este módulo tumbe rutas que no necesitan login real.
 */
function requireEnv(name: string, fallback: string): string {
  const value = process.env[name]
  if (!value) {
    console.warn(
      `[auth] Falta la variable de entorno ${name} — usando placeholder (solo para visualizar la UI, el login no funcionará).`
    )
    return fallback
  }
  return value
}

/** Payload del id token (JWT) — solo nos interesa el claim `roles` (App Roles de Entra). */
function decodeRolesFromIdToken(idToken: string): unknown {
  const payload = idToken.split(".")[1]
  if (!payload) return undefined
  const json = Buffer.from(payload, "base64url").toString("utf-8")
  return (JSON.parse(json) as { roles?: unknown }).roles
}

/**
 * Escribe `roles` desde el id token de Entra en cada login de personal JDH.
 *
 * `roles` es un `additionalField` con `input: false` para que un usuario no
 * pueda auto-asignárselo desde el cliente — pero Better Auth aplica ESE MISMO
 * filtro al perfil que devuelve `mapProfileToUser`, así que un valor puesto
 * ahí nunca se persiste. La única vía que sí escribe estos campos es
 * `internalAdapter.updateUser` desde este hook, que no pasa por ese filtro.
 *
 * `create` cubre el primer login; `update` cubre cada login siguiente (Better
 * Auth refresca los tokens de la cuenta ahí) — así un cambio de App Role en
 * Entra se refleja en el siguiente login normal.
 *
 * No aplica a las cuentas de cliente (`providerId === "credential"`): sus
 * roles y su vínculo con el ERP los asigna el panel de administración, no un
 * proveedor de identidad.
 */
async function enrichFromEntra(
  account: {
    providerId: string
    userId: string
    idToken?: string | null
  },
  ctx: {
    context: {
      internalAdapter: {
        updateUser: (
          id: string,
          data: Record<string, unknown>
        ) => Promise<unknown>
      }
    }
  } | null
): Promise<void> {
  if (account.providerId !== "microsoft" || !ctx || !account.idToken) return

  await ctx.context.internalAdapter.updateUser(account.userId, {
    roles: normalizeRoles(decodeRolesFromIdToken(account.idToken)),
  })
}

/**
 * Config separada del `plugins` que la usa (en vez de todo inline en un solo
 * `betterAuth({...})`): `customSession` necesita ver este objeto explícito
 * para inferir `user.additionalFields` en su callback — como parte de un
 * `plugins` inline dentro del mismo objeto que se está construyendo,
 * TypeScript no puede inferirlo (referencia circular).
 */
const pool = new Pool({
  connectionString: requireEnv(
    "DATABASE_URL",
    "postgres://placeholder:placeholder@localhost:5432/jdh_catalogo"
  ),
})

/**
 * `pg.Pool` es un `EventEmitter`: si un cliente inactivo del pool encuentra un
 * error de conexión (credenciales inválidas, host inalcanzable — exactamente
 * lo que pasa con el `DATABASE_URL` placeholder mientras no hay
 * infraestructura, ver ARCHITECTURE.md) y NADIE escucha `error`, Node trata
 * ese evento como una excepción no capturada y tumba el proceso. Este
 * listener es obligatorio según la documentación de `pg`, no una mejora
 * opcional — sin él, cada intento fallido de sesión puede reventar
 * `next dev`, no solo esa request.
 */
pool.on("error", (error) => {
  console.error("[auth] Error de conexión a Postgres:", error)
})

const options = {
  database: pool,
  baseURL: process.env.BETTER_AUTH_URL,
  secret: requireEnv(
    "BETTER_AUTH_SECRET",
    "placeholder-mockup-secret-do-not-use-in-real-deploys"
  ),
  user: {
    additionalFields: {
      /** Roles del usuario. Ver `src/config/permissions.ts`. */
      roles: {
        type: "string[]",
        input: false,
        required: false,
        defaultValue: [ROLES.cliente],
      },
      /**
       * Código del cliente en el ERP (SIESA). Lo asigna un admin al aprobar
       * la cuenta; sin él, la sesión ve precios públicos.
       */
      clienteId: { type: "string", input: false, required: false },
      /** Lista de precios negociada, asignada junto con `clienteId`. */
      listaPrecioId: { type: "string", input: false, required: false },
      /** Preferencia del cliente: mostrar precios con IVA incluido. */
      preferenciaMostrarIva: {
        type: "boolean",
        input: true,
        required: false,
        defaultValue: true,
      },
    },
  },
  /**
   * Cuentas de CLIENTE (externos). Los clientes no están en el tenant de
   * Entra, así que su ingreso es email + contraseña.
   *
   * `disableSignUp: true` a propósito: el acceso de un cliente se habilita
   * desde el panel de administración (que crea la cuenta y la vincula a su
   * `clienteId` en el ERP), no por auto-registro — un auto-registro no puede
   * verificar que quien se inscribe sea realmente ese cliente, y de ahí
   * dependen los precios negociados.
   */
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
    requireEmailVerification: false,
  },
  /** Cuentas de PERSONAL JDH (asesores y administradores) vía Entra ID. */
  socialProviders: {
    microsoft: {
      clientId: requireEnv("AUTH_MICROSOFT_ENTRA_ID_ID", "placeholder-client-id"),
      clientSecret: requireEnv(
        "AUTH_MICROSOFT_ENTRA_ID_SECRET",
        "placeholder-client-secret"
      ),
      tenantId: JDH_TENANT_ID,
      prompt: "select_account",
      disableProfilePhoto: true,
      // Sin esto, un cambio de App Role en Entra solo se refleja tras
      // desvincular y volver a vincular la cuenta.
      overrideUserInfoOnSignIn: true,
      mapProfileToUser(profile) {
        assertJdhTenant(profile)
        return {
          // `oid` es el identificador estable de Entra; `sub` es pairwise y
          // cambiaría si el App Registration se recrea alguna vez.
          id: profile.oid,
          name: profile.name,
          email: profile.email ?? profile.preferred_username,
        }
      },
    },
  },
  databaseHooks: {
    account: {
      create: { after: enrichFromEntra },
      update: { after: enrichFromEntra },
    },
  },
  session: {
    cookieCache: { enabled: true, maxAge: 60 * 5 },
  },
} satisfies BetterAuthOptions

export const auth = betterAuth({
  ...options,
  plugins: [
    // Deriva `permissions` de `roles` en cada lectura de sesión — nunca se
    // guarda en la base de datos, así que un cambio en `ROLE_PERMISSIONS` se
    // refleja de inmediato sin tocar filas existentes. El segundo argumento
    // (`options`) es lo que le permite a TypeScript ver `roles` en `user`.
    customSession(
      async ({ user, session }) => ({
        session,
        user: {
          ...user,
          permissions: permissionsForRoles(normalizeRoles(user.roles)),
        },
      }),
      options
    ),
    // Debe ir último: aplica los `Set-Cookie` de Better Auth vía las cookies
    // de Next.js (Server Actions / Route Handlers).
    nextCookies(),
  ],
})

export type Auth = typeof auth
