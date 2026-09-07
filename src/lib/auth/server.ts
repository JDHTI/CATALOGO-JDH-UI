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

import { FOTO_PERFIL_PATH } from "./foto-perfil"
import { CONTRASENA_MAX, CONTRASENA_MIN } from "./registro"
import { assertJdhTenant, JDH_TENANT_ID } from "./tenant"

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Falta la variable de entorno ${name}`)
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
/**
 * Pool dimensionado para SERVERLESS, que es como corre esto en Vercel.
 *
 * El `max` por defecto de `pg` es 10, y ahí está la trampa: en serverless no
 * hay UN proceso con un pool, hay tantas instancias como concurrencia tenga la
 * función, y cada una abre el suyo. El total contra la base es
 * `instancias × max`, así que con el valor por defecto basta un pico modesto
 * para agotar las ~100 conexiones que trae un Postgres gestionado y empezar a
 * devolver 500 por "too many clients". Un `max` pequeño acota ese producto;
 * el `idleTimeoutMillis` corto devuelve la conexión rápido, que es justo lo
 * que conviene cuando la instancia se congela entre invocaciones.
 *
 * `connectionTimeoutMillis` es lo que convierte un host inalcanzable en un
 * error rápido y legible en los logs, en vez de una petición colgada hasta que
 * la plataforma la corta sin explicación.
 *
 * Si algún día se pone un pooler delante (PgBouncer, el `-pooler` de Neon),
 * esto puede bajar a 1: quien multiplexa entonces es el pooler.
 */
const pool = new Pool({
  connectionString: requireEnv("DATABASE_URL"),
  max: 3,
  idleTimeoutMillis: 10_000,
  connectionTimeoutMillis: 10_000,
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
  secret: requireEnv("BETTER_AUTH_SECRET"),
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
   * El auto-registro está ABIERTO (antes `disableSignUp: true`). La objeción
   * original sigue siendo cierta —nadie puede demostrar en un formulario que
   * es tal cliente del ERP— pero se resuelve donde de verdad importa, que es
   * el PRECIO y no la existencia de la cuenta: una cuenta recién registrada
   * nace sin `clienteId` ni `listaPrecioId` (ambos `input: false`, ver abajo),
   * así que `getPriceContext()` la trata como público y ve exactamente la
   * misma lista que un visitante anónimo. Vincularla a un cliente del ERP —y
   * con ello abrirle los precios negociados— sigue siendo un acto exclusivo
   * del panel de administración. Registrarse solo da identidad (favoritos,
   * listas, pedidos), nunca precio.
   *
   * `minPasswordLength` es lo único que Better Auth sabe imponer; el resto de
   * la política vive en `./registro.ts` y la aplica la Server Action de
   * `./acciones.ts`. Este mínimo es la última línea: cubre también cualquier
   * alta que no pase por ese formulario.
   */
  emailAndPassword: {
    enabled: true,
    disableSignUp: false,
    // Sin infraestructura de correo todavía (ver ARCHITECTURE.md): exigir
    // verificación aquí dejaría a toda cuenta nueva sin poder entrar. Cuando
    // exista el envío, esto pasa a `true` junto con `sendVerificationEmail`.
    requireEmailVerification: false,
    autoSignIn: true,
    minPasswordLength: CONTRASENA_MIN,
    maxPasswordLength: CONTRASENA_MAX,
  },
  /** Cuentas de PERSONAL JDH (asesores y administradores) vía Entra ID. */
  socialProviders: {
    microsoft: {
      clientId: requireEnv("AUTH_MICROSOFT_ENTRA_ID_ID"),
      clientSecret: requireEnv("AUTH_MICROSOFT_ENTRA_ID_SECRET"),
      tenantId: JDH_TENANT_ID,
      prompt: "select_account",
      // Los scopes por defecto del proveedor ya son los concedidos en el App
      // Registration (openid, profile, email, User.Read, offline_access), así
      // que no hace falta declararlos: pedir uno de más provocaría una
      // pantalla de consentimiento que el tenant no puede aprobar.
      //
      // Se deja en `true` a propósito. Better Auth traería la foto de Graph
      // por su cuenta, pero la guarda como data URL en base64 dentro de
      // `user.image`, y eso termina dentro de la cookie de sesión. Ver
      // `./foto-perfil.ts` para el detalle y la alternativa que se usa.
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
          // Ruta fija, no los bytes: el handler resuelve la foto por sesión.
          // El proveedor asigna `image: profile.picture` antes de mezclar lo
          // que devuelve esta función, así que esto lo sobrescribe.
          image: FOTO_PERFIL_PATH,
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
  /**
   * Límite de peticiones sobre los endpoints de identidad. Better Auth lo
   * activa solo en producción por defecto; eso se respeta (en desarrollo un
   * tope bajo estorba más de lo que protege), pero los caminos que aceptan
   * una credencial reciben reglas mucho más estrictas que el global.
   *
   * `storage: "database"` y no el contador en memoria por defecto: en memoria
   * el límite es POR PROCESO, así que con más de una instancia detrás de un
   * balanceador el atacante multiplica sus intentos por el número de réplicas.
   * La tabla `rateLimit` la crea `pnpm auth:migrate`.
   */
  rateLimit: {
    storage: "database",
    customRules: {
      // 5 intentos por minuto: suficiente para quien se equivoca de
      // contraseña, inservible para recorrer un diccionario.
      "/sign-in/email": { window: 60, max: 5 },
      "/sign-up/email": { window: 60, max: 3 },
      "/forget-password": { window: 60, max: 3 },
      "/reset-password": { window: 60, max: 5 },
    },
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
