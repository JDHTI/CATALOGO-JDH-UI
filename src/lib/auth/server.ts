import "server-only"

import { betterAuth } from "better-auth"
import type { BetterAuthOptions } from "better-auth"
import { nextCookies } from "better-auth/next-js"
import { customSession, jwt } from "better-auth/plugins"
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
    // Marca de identidad, no de rol: un empleado sin App Role cae en
    // `cliente` igual que un externo, así que `roles` no sirve para esto.
    // Ya la puso `marcarEmpleadoEnEntra` en la sesión; aquí se repite para
    // que la fila quede bien aunque ese camino cambie. Ver `definePayload`.
    empleado: true,
  })
}

/**
 * ¿La escritura ocurre dentro del callback OAuth de Microsoft? Es el ÚNICO
 * camino que puede marcar a alguien como empleado: el tenant JDH ya lo validó
 * `mapProfileToUser` (que corre antes, en `getUserInfo`). El contexto es el
 * del endpoint de Better Auth: `path` es la plantilla de la ruta.
 */
export function esCallbackDeEntra(
  ctx: { path?: string; params?: Record<string, unknown> } | null | undefined
): boolean {
  return ctx?.path === "/callback/:id" && ctx.params?.id === "microsoft"
}

/**
 * `user.create.before` / `user.update.before`: pone `empleado: true` en la
 * MISMA escritura del usuario que hace el callback de Microsoft.
 *
 * Por qué no basta `enrichFromEntra`: Better Auth encola los hooks `after`
 * (`queueAfterTransactionHook`) y los corre DESPUÉS de crear la sesión, pero
 * la cookie de `session.cookieCache` se arma con el usuario que devolvió esa
 * escritura. Resultado en producción: el primer login de cada empleado veía
 * `empleado: false` durante los 5 minutos de la caché, y el catálogo no pedía
 * precios. Un hook `before` se fusiona en la escritura, así que el usuario que
 * va a la cookie ya trae la marca:
 *
 * - usuario nuevo → `createOAuthUser` (create.before);
 * - usuario existente → la reescritura de `overrideUserInfoOnSignIn`
 *   (update.before). Sin esa opción el callback usaría la fila leída antes y
 *   esto no alcanzaría: ver `tests/entra-primer-login.test.ts`.
 *
 * Los `roles` no pueden ir por aquí (el hook no ve el id token) y siguen
 * llegando por `enrichFromEntra`.
 */
async function marcarEmpleadoEnEntra(
  _user: unknown,
  ctx: { path?: string; params?: Record<string, unknown> } | null
) {
  if (!esCallbackDeEntra(ctx)) return
  return { data: { empleado: true } }
}

/**
 * Origen público de la app. Better Auth lo usa para armar el Redirect URI de
 * OAuth (`{baseURL}/api/auth/callback/microsoft`) y para validar los
 * `callbackURL` que llegan del cliente.
 *
 * En Vercel NO puede ser un valor fijo: cada despliegue de preview responde
 * por un host distinto (`<proyecto>-<hash>-<equipo>.vercel.app`), así que una
 * `BETTER_AUTH_URL` escrita a mano dejaría el ingreso roto en todos ellos.
 * Orden de resolución:
 *
 * 1. `BETTER_AUTH_URL` — override explícito, y lo que SÍ debe fijarse en el
 *    entorno de producción. Entra exige que el Redirect URI registrado
 *    coincida exacto con el host que manda la petición: si aquí saliera el
 *    `.vercel.app` y el App Registration tiene el dominio propio, Microsoft
 *    responde `AADSTS50011`.
 * 2. `VERCEL_PROJECT_PRODUCTION_URL` en producción — el dominio de producción
 *    del proyecto (el custom domain más corto si existe, si no el
 *    `.vercel.app`), estable entre despliegues. Con más de un dominio propio
 *    la elección deja de ser evidente: de ahí que (1) siga siendo lo
 *    recomendado en producción.
 * 3. `VERCEL_URL` — el host de este despliegue concreto (preview).
 * 4. `undefined` — Better Auth lo deriva del request entrante, que es lo
 *    correcto en local, donde `next dev` puede acabar en cualquier puerto.
 *
 * Las variables de Vercel llegan solas mientras el proyecto tenga activado
 * "Automatically expose System Environment Variables" (por defecto lo está).
 */
function resolveBaseURL(): string | undefined {
  if (process.env.BETTER_AUTH_URL) return process.env.BETTER_AUTH_URL
  if (
    process.env.VERCEL_ENV === "production" &&
    process.env.VERCEL_PROJECT_PRODUCTION_URL
  ) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  }
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return undefined
}

/**
 * Sin `trustedOrigins`, Better Auth confía únicamente en `baseURL` y rechaza
 * cualquier `callbackURL` de otro origen. Un despliegue de Vercel contesta por
 * VARIOS hosts a la vez —el del despliegue (`VERCEL_URL`), el alias de la rama
 * (`VERCEL_BRANCH_URL`) y el de producción— y el navegador usa el que el
 * usuario abrió, no el que eligió `resolveBaseURL()`. Sin esta lista, entrar
 * por el alias de rama falla con "Invalid callbackURL".
 */
function resolveTrustedOrigins(): string[] {
  const hosts = [
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
    process.env.VERCEL_BRANCH_URL,
    process.env.VERCEL_URL,
  ].filter((host): host is string => Boolean(host))

  return [...new Set(hosts.map((host) => `https://${host}`))]
}

const trustedOrigins = resolveTrustedOrigins()

/**
 * Config separada del `plugins` que la usa (en vez de todo inline en un solo
 * `betterAuth({...})`): `customSession` necesita ver este objeto explícito
 * para inferir `user.additionalFields` en su callback — como parte de un
 * `plugins` inline dentro del mismo objeto que se está construyendo,
 * TypeScript no puede inferirlo (referencia circular).
 */
const pool = new Pool({
  connectionString: requireEnv("DATABASE_URL"),
  /**
   * En un despliegue sin servidor (Vercel) cada instancia de función tiene su
   * PROPIO pool, y hay tantas instancias vivas como concurrencia: el `max: 10`
   * por defecto de `pg` multiplicado por N instancias agota el
   * `max_connections` de Postgres (100 por defecto) con muy poco tráfico. Con
   * 3, el pool sigue absorbiendo la ráfaga de una misma instancia sin ser
   * quien tumba la base.
   *
   * Por la misma razón el `DATABASE_URL` de producción tiene que apuntar a un
   * POOLER en modo transacción (PgBouncer, el endpoint `-pooler` de Neon, el
   * pooler de Supabase), no al puerto directo de Postgres. Better Auth consulta
   * con sentencias parametrizadas sin nombre, que el modo transacción admite.
   */
  max: 3,
  /**
   * Cerrar pronto los clientes inactivos: una instancia congelada entre
   * invocaciones no debe retener una conexión de la base mientras duerme.
   */
  idleTimeoutMillis: 10_000,
  /**
   * Fallar rápido en vez de dejar la petición colgada hasta el timeout de la
   * función cuando la base no está alcanzable. Los dos caminos que consultan
   * ya tratan el fallo como "sin sesión" (`proxy.ts`) o como un 503 controlado
   * (`api/auth/[...all]/route.ts`).
   */
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
  baseURL: resolveBaseURL(),
  // Se omite cuando la lista sale vacía (fuera de Vercel): Better Auth cae
  // entonces a su valor por defecto, que es confiar solo en `baseURL`.
  ...(trustedOrigins.length > 0 && { trustedOrigins }),
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
      /**
       * La cuenta entró por Entra ID (personal JDH). Lo escribe SOLO
       * `enrichFromEntra`; `input: false` impide que un registro de cliente
       * se lo auto-asigne, igual que `clienteId`. Abre la lista de precios
       * de empleados en el API (claim `empleado` del JWT).
       */
      empleado: {
        type: "boolean",
        input: false,
        required: false,
        defaultValue: false,
      },
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
      // desvincular y volver a vincular la cuenta. Además es la escritura
      // del usuario en la que `marcarEmpleadoEnEntra` pone `empleado` antes
      // de que se arme la cookie de la sesión: no quitarla.
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
    user: {
      create: { before: marcarEmpleadoEnEntra },
      update: { before: marcarEmpleadoEnEntra },
    },
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

/**
 * Identificadores LÓGICOS del emisor y del destinatario de los JWT, no URLs.
 *
 * La tentación es usar `baseURL` como `iss` (convención OIDC, permite
 * descubrir el JWKS desde el propio token), pero en Vercel ese host cambia en
 * cada despliegue de preview: el API tendría que aceptar un `iss` distinto por
 * despliegue, o rechazar los de preview. Un identificador estable evita las
 * dos cosas, y `iss`/`aud` admiten cualquier `StringOrURI`.
 *
 * El API recibe la URL del JWKS por su propia variable de entorno, así que no
 * necesita derivarla del token.
 */
export const JWT_ISSUER = "jdh-catalogo-ui"
export const JWT_AUDIENCE = "jdh-catalogo-api"

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
    /**
     * Firma JWT de vida corta para que `jdh-catalogo-api` pueda identificar al
     * usuario SIN tocar la base `jdh_auth`.
     *
     * La alternativa que esto reemplaza era que el API validara directamente
     * la fila de `session` que Better Auth escribe aquí: dos servicios leyendo
     * un esquema que es propiedad de una librería del otro, con
     * `BETTER_AUTH_SECRET` convertido en secreto compartido imposible de rotar
     * por separado. Con firma asimétrica el API solo necesita la clave PÚBLICA
     * (`GET /api/auth/jwks`): no hay secreto compartido, no hay credenciales de
     * base de datos fuera de esta app, y una migración de Better Auth que
     * renombre una columna ya no puede romper el API en silencio.
     *
     * Se descartó que el API llamara a `GET /api/auth/get-session`: no necesita
     * criptografía, pero añade un salto de red por petición y convierte a esta
     * app en dependencia dura del API para cada request autenticado.
     *
     * `disableSettingJwtHeader: true` a propósito. Por defecto el plugin firma
     * un JWT y lo devuelve en la cabecera `set-auth-jwt` de CADA
     * `/get-session` — es decir, en cada carga de página de un usuario con
     * sesión, y accesible desde JavaScript del cliente. Aquí el único
     * consumidor es `src/lib/api/backend-fetch.ts`, que corre en el servidor y
     * pide el token explícitamente: firmar en cada carga sería trabajo puro
     * desperdiciado, y entregar un bearer al navegador contradice la decisión
     * de que la autoridad sea siempre la cookie.
     */
    jwt({
      disableSettingJwtHeader: true,
      jwt: {
        issuer: JWT_ISSUER,
        audience: JWT_AUDIENCE,
        /**
         * `backendFetch` firma uno nuevo en cada llamada, así que el TTL solo
         * tiene que cubrir esa petición; se deja margen para un reintento
         * aguas abajo. Corto porque el token es un bearer: si se filtra de un
         * log, caduca antes de servir de nada.
         *
         * Es también la ventana en la que el API puede seguir viendo un
         * `listaPrecioId` que un admin acaba de quitar. Coincide a propósito
         * con `session.cookieCache` (5 min), que ya tiene ese mismo desfase:
         * no introduce una latencia de propagación nueva.
         */
        expirationTime: "5m",
        /**
         * `permissions` NO viaja en la sesión de la base de datos: lo deriva
         * el plugin `customSession` en cada lectura. Pero el `jwt` toma la
         * sesión CRUDA del `sessionMiddleware`, no la salida de
         * `customSession`, así que hay que derivarlo aquí también — con la
         * misma función, para que las dos vías no se desincronicen.
         *
         * `clienteId` y `listaPrecioId` van en el token porque son lo que el
         * API necesita para resolver precios negociados. Siguen siendo
         * `input: false`: el usuario no puede influir en su valor, y el token
         * lo firma esta app, que es la única autoridad sobre esos campos. Aun
         * así el API debe tratar `listaPrecioId` como una referencia a
         * verificar contra su propio catálogo de listas, no como un permiso.
         */
        definePayload({ user }) {
          const roles = normalizeRoles(user.roles)
          return {
            name: user.name,
            email: user.email,
            roles,
            permissions: permissionsForRoles(roles),
            clienteId: user.clienteId ?? null,
            listaPrecioId: user.listaPrecioId ?? null,
            /**
             * El API solo acepta el booleano `true`: con él añade
             * `precioEmpleado` a `/products`. Se emite `false` explícito (no
             * se omite) para que un token de cliente sea inequívoco al leerlo.
             */
            empleado: user.empleado === true,
          }
        },
      },
    }),
    // Debe ir último: aplica los `Set-Cookie` de Better Auth vía las cookies
    // de Next.js (Server Actions / Route Handlers).
    nextCookies(),
  ],
})

export type Auth = typeof auth
