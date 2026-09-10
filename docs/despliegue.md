# Despliegue en Vercel

Guía operativa de `jdh-catalogo-ui`. El _por qué_ de cada decisión está en
`.claude/ARCHITECTURE.md` (entrada del 2026-09-07); el detalle de cada variable,
en `.env.example`. Aquí está lo que hay que hacer.

## 1. Qué se despliega y qué no

Vercel aloja **solo esta app**, y esta app es a la vez el catálogo y el
**servidor de autenticación**: Better Auth corre dentro del servidor de Next
(`src/app/api/auth/[...all]/route.ts`).

Fuera de Vercel tienen que estar, accesibles por internet y por HTTPS:

| Pieza                  | Quién la consume                                       | Estado                                                                           |
| ---------------------- | ------------------------------------------------------ | -------------------------------------------------------------------------------- |
| Postgres `jdh_auth`    | Better Auth, desde las funciones de Vercel             | ❌ Solo `localhost:5435`. Sin él no hay ingreso; el catálogo público sí funciona |
| API `jdh-catalogo-api` | El navegador y el servidor, vía `NEXT_PUBLIC_API_URL`  | ✅ En Railway, pero **sin datos** (§7.2)                                         |
| Bucket R2              | El navegador, y `next.config.ts` para `remotePatterns` | ✅ Dominio público de R2                                                         |

Lo que hoy bloquea un despliegue útil está en §7.

## 2. Variables de entorno, por entorno de Vercel

Marcar en el dashboard qué entornos recibe cada una. `NEXT_PUBLIC_*` se
incrusta en el bundle **en tiempo de build**: cambiarla exige redespliegue.

| Variable                            | Production       | Preview            | Notas                                                                                      |
| ----------------------------------- | ---------------- | ------------------ | ------------------------------------------------------------------------------------------ |
| `AUTH_MICROSOFT_ENTRA_ID_ID`        | ✅               | ✅                 | Obligatoria: el módulo la exige al importarse                                              |
| `AUTH_MICROSOFT_ENTRA_ID_SECRET`    | ✅ _(Sensitive)_ | ✅ _(Sensitive)_   | Rotarla en Azure obliga a actualizarla aquí                                                |
| `AUTH_MICROSOFT_ENTRA_ID_TENANT_ID` | ✅               | ✅                 | El del tenant de JDH, nunca `common`                                                       |
| `BETTER_AUTH_SECRET`                | ✅ _(Sensitive)_ | ✅ _(Sensitive)_   | **Uno distinto por entorno.** Rotarlo invalida sesiones y exige `TRUNCATE TABLE jwks` (§4) |
| `BETTER_AUTH_URL`                   | ✅ dominio real  | ❌ **dejar vacía** | Ver §3                                                                                     |
| `DATABASE_URL`                      | ✅ _(Sensitive)_ | ✅ _(Sensitive)_   | Puerto del **pooler**, `sslmode=require`. Ver §4                                           |
| `NEXT_PUBLIC_API_URL`               | ✅ HTTPS         | ✅ HTTPS           | Con el prefijo `/api/v1`. Hoy: `https://catalogo-jdh-api-production.up.railway.app/api/v1` |
| `NEXT_PUBLIC_ASSETS_CDN_URL`        | ✅               | ✅                 | De aquí sale el host de `images.remotePatterns`                                            |
| `BACKEND_API_URL`                   | —                | —                  | `backend-fetch.ts` existe pero nadie lo llama todavía                                      |
| `ALLOW_LOCAL_IMAGE_HOSTS`           | ❌ **nunca**     | ❌ **nunca**       | Solo para probar un build de producción en local                                           |

Las variables de sistema (`VERCEL_ENV`, `VERCEL_URL`,
`VERCEL_PROJECT_PRODUCTION_URL`, `VERCEL_BRANCH_URL`) las inyecta Vercel; §3 y
§4 dependen de ellas, así que **"Automatically expose System Environment
Variables"** tiene que quedarse activado.

## 3. `BETTER_AUTH_URL`: qué poner

Es el origen con el que Better Auth arma el Redirect URI de OAuth
(`{BETTER_AUTH_URL}/api/auth/callback/microsoft`) y valida los `callbackURL`.
No se puede fijar un único valor porque cada preview de Vercel responde por un
host distinto, así que `resolveBaseURL()` (`src/lib/auth/server.ts`) lo resuelve
en cascada:

1. `BETTER_AUTH_URL`, si está.
2. `https://$VERCEL_PROJECT_PRODUCTION_URL`, si `VERCEL_ENV === "production"`.
3. `https://$VERCEL_URL` (el despliegue concreto → previews).
4. `undefined` → Better Auth lo deriva del request (local, cualquier puerto).

**Qué configurar:**

- **Producción: fijarla explícitamente** al dominio real, con esquema y **sin
  barra final** — `https://catalogo.jdh.com.co`. El paso 2 acertaría solo, pero
  `VERCEL_PROJECT_PRODUCTION_URL` es "el custom domain más corto", y en cuanto
  el proyecto tenga dos dominios eso deja de ser determinista. Entra compara el
  Redirect URI carácter a carácter: cualquier deriva devuelve `AADSTS50011`.
- **Preview: dejarla vacía.** Definirla apuntaría todos los previews al host de
  otro despliegue.
- **Local: dejarla vacía** (`.env.local` puede omitirla).

`trustedOrigins` se rellena aparte con los tres hosts de Vercel, porque un
despliegue contesta por varios a la vez y el navegador usa el que el usuario
abrió, no el que eligió la cascada.

## 4. `DATABASE_URL`: por qué está en el "frontend", y cómo va en Vercel

**No es una fuga ni un descuido:** esta app también es el servidor de
autenticación. `src/lib/auth/server.ts` abre un `pg.Pool` propio contra la base
`jdh_auth`, donde viven `user`, `session`, `account`, `verification` y
`rateLimit`. La cadena no llega nunca al navegador — el módulo lleva
`import "server-only"` y la variable no tiene prefijo `NEXT_PUBLIC_`, así que
no entra en ningún bundle de cliente. Si alguna vez la autenticación se
extrajera a su propio servicio, esta variable se iría con él.

En Vercel hay dos requisitos que en local no existen:

- **Postgres accesible desde internet.** El compose de `jdh-catalogo-api` lo
  publica en `localhost:5435`; las funciones de Vercel no lo alcanzan. Hace
  falta un Postgres administrado (Neon, Supabase) o el de la empresa expuesto
  con TLS y la IP filtrada.
- **Conectar al pooler, no al puerto directo.** Cada instancia de función tiene
  su propio pool: `max` × instancias agota el `max_connections` de Postgres muy
  pronto. Por eso el pool está en `max: 3` y por eso la cadena debe apuntar al
  endpoint del pooler en modo transacción, con `sslmode=require`.

Lo que amortigua el resto es que casi ningún request llega a consultar:
`hasSessionCookie()` resuelve "sin sesión" sin tocar la base (la mayoría del
tráfico del catálogo es anónimo) y `session.cookieCache` cubre 5 minutos por
sesión viva.

**El API no entra aquí.** `jdh-catalogo-api` **no** debe recibir este
`DATABASE_URL` ni conectarse a `jdh_auth`: identifica al usuario verificando un
JWT firmado. El contrato está en §9.

**Migraciones:** `pnpm auth:migrate` **no** corre en el build de Vercel. Hay que
ejecutarlo a mano contra cada base, desde una máquina que la alcance, con el
`DATABASE_URL` de ese entorno en el entorno del shell:

```powershell
$env:DATABASE_URL = "postgres://…"; pnpm auth:migrate
```

Tablas que crea: `user`, `session`, `account`, `verification`, `rateLimit` y
**`jwks`** (el par de claves de firma; la privada cifrada con
`BETTER_AUTH_SECRET`). Cada entorno firma con su propia clave, porque la tabla
vive en su base — otra razón para que preview y producción **no** compartan
`DATABASE_URL`: si la comparten, un token emitido en preview valida contra
producción.

**Rotar `BETTER_AUTH_SECRET` exige vaciar `jwks`.** El secreto cifra la clave
privada de esa tabla; uno nuevo no la descifra y la firma muere con
`Failed to decrypt private key`, sin regenerarse. Los dos pasos van juntos:

```sql
TRUNCATE TABLE jwks;
```

El API no requiere ninguna acción: `jose` ve un `kid` desconocido y vuelve a
pedir el JWKS. Solo fallan los tokens ya emitidos (≤5 min). La clave de firma no
caduca por su cuenta — no se configuró `rotationInterval` —, así que rotarla es
este mismo `TRUNCATE`.

## 5. Entra ID: Redirect URIs

En el App Registration → **Authentication** → plataforma **Web**, registrar uno
por cada origen desde el que se vaya a iniciar sesión:

```
http://localhost:3000/api/auth/callback/microsoft
https://catalogo.jdh.com.co/api/auth/callback/microsoft
```

Azure no admite comodines para estos hosts, así que **el ingreso con Entra no
funciona en un preview cualquiera**: su URL cambia en cada despliegue y no se
puede pre-registrar. Dos salidas, según haga falta:

- Aceptarlo: en preview se prueba con cuentas de cliente (email + contraseña),
  que no pasan por Entra.
- Registrar el **alias de rama**, que sí es estable
  (`https://<proyecto>-git-<rama>-<equipo>.vercel.app/api/auth/callback/microsoft`),
  para la rama de integración. Está en `trustedOrigins` por esto mismo.

Si falta el URI, Microsoft responde `AADSTS50011` y no hay nada que depurar en
el código.

## 6. Ajustes del proyecto en Vercel

- **Framework:** Next.js (autodetectado; `vercel.json` lo declara igual).
- **Package manager:** pnpm, por el campo `packageManager` de `package.json`.
  Install y build por defecto (`pnpm install`, `pnpm build`); no hay que
  sobrescribirlos.
- **Node:** `engines.node: ">=22"` fija el runtime; Vercel elige el mayor
  soportado dentro del rango.
- **Región:** `iad1` en `vercel.json` — la de menor latencia hacia Colombia de
  las disponibles. **La base de datos debe vivir en la misma región**, o cada
  lectura de sesión paga el viaje de ida y vuelta.
- **Deployment Protection:** si se deja activada en preview, el SSO de Vercel se
  interpone antes de la app y el flujo de Entra no llega al callback. Para
  probar autenticación en un preview hay que desactivarla en ese despliegue o
  usar un bypass token.
- **`proxy.ts` corre en Node**, no en edge: Next 16 no soporta el runtime edge
  ahí, y este proxy consulta Postgres directamente. No hay que configurar nada,
  pero explica por qué las rutas protegidas cuestan una invocación extra.

## 7. Antes del primer despliegue real

Bloqueantes, en orden:

1. **Postgres `jdh_auth` administrado**, con pooler, y `pnpm auth:migrate`
   aplicado. Sin esto no hay ingreso (el catálogo público sí funciona).
2. ~~**`jdh-catalogo-api` desplegado en HTTPS público.**~~ **Hecho** — está en
   Railway: `https://catalogo-jdh-api-production.up.railway.app/api/v1`.
   Verificado el 2026-09-07: `/health` responde `status: ok` con `database`,
   `cache` y `storage` en `up`, y devuelve `access-control-allow-origin: *`, así
   que por CORS no hay nada que configurar.

   **Pero está VACÍO:** `products`, `suppliers` y `brands` devuelven 0
   registros, y `/health` reporta `datawarehouse: "disabled"` — la sincronización
   que puebla el catálogo no tiene origen de datos en ese despliegue. La UI
   responderá 200 y pintará su estado **vacío** (no de error: `{ total: 0 }` es
   una respuesta válida), lo cual no se distingue de un catálogo roto para quien
   lo abra. Habilitar el DWH en Railway (`DWH_HOST` y compañía) y correr la
   sincronización es lo que queda para que el despliegue sirva de algo.

3. **Redirect URI de producción registrado en Entra** (§5).
4. **Secretos nuevos para producción:** `BETTER_AUTH_SECRET` propio (no el de
   `.env.local`) y, si se comparte con el equipo, un client secret de Entra
   rotado.

Pendientes conocidos, no bloqueantes: sin infraestructura de correo,
`requireEmailVerification` sigue en `false` y el registro revela si un correo ya
existe (ARCHITECTURE.md, 2026-09-03). Tampoco hay cabeceras de seguridad
propias (CSP, HSTS) — decisión aparte, porque una CSP tiene que contemplar el
host del bucket y los estilos en línea de Next.

## 8. Verificación después de desplegar

1. `/` y `/productos` responden 200 y **pintan productos** (si no, es el §7.2).
2. Una ruta protegida sin sesión → 307 a `/ingreso?redirectTo=…`.
3. `/admin` sin el permiso `admin:access` → 404, no 403.
4. Registro de cliente y ingreso con email; comprobar que la cookie sale
   `HttpOnly; Secure; SameSite=Lax` y con prefijo `__Secure-`.
5. Ingreso con Entra: debe aterrizar en `/` con la cortina de bienvenida.
6. La foto de perfil se sirve por `/api/perfil/foto` (404 y avatar de iniciales
   es una respuesta válida), nunca como data URL.
7. Un producto y un logo cargan por `/_next/image`. Un 400 `"url" parameter is
not allowed` significa que `NEXT_PUBLIC_ASSETS_CDN_URL` no coincide con el
   host real del bucket.
8. `GET /api/auth/jwks` responde con una clave pública y **sin** el componente
   `d` (si aparece `d`, se está sirviendo la clave privada: parar y revisar).

## 9. Contrato para `jdh-catalogo-api`

El API **no** tiene credenciales de `jdh_auth` ni lee su esquema. Recibe la
identidad en un JWT que firma esta app (`src/lib/auth/server.ts`, plugin `jwt`)
y que `src/lib/api/backend-fetch.ts` reenvía como `Authorization: Bearer`.

| Qué                | Valor                                                                 |
| ------------------ | --------------------------------------------------------------------- |
| Algoritmo          | `EdDSA` (Ed25519), asimétrico                                         |
| JWKS               | `GET {origen de la UI}/api/auth/jwks` — solo clave pública            |
| `iss`              | `jdh-catalogo-ui`                                                     |
| `aud`              | `jdh-catalogo-api`                                                    |
| `sub`              | id del usuario                                                        |
| TTL                | 5 minutos                                                             |
| Claims adicionales | `name`, `email`, `roles`, `permissions`, `clienteId`, `listaPrecioId` |

Del lado de Nest, un guard con `jose` (ya es dependencia transitiva):

```ts
import { createRemoteJWKSet, jwtVerify } from "jose"

const jwks = createRemoteJWKSet(new URL(process.env.AUTH_JWKS_URL))

const { payload } = await jwtVerify(token, jwks, {
  issuer: "jdh-catalogo-ui",
  audience: "jdh-catalogo-api",
})
```

`AUTH_JWKS_URL` es una variable **del API**, y apunta al origen de la UI del
mismo entorno. No se deriva del `iss` a propósito: `iss` es un identificador
lógico estable, porque el host de la UI cambia en cada preview de Vercel.

> **Ojo con el origen: hoy NO es `catalogo.jdh.com.co`.** Ese es el dominio
> propio PREVISTO y todavía **no resuelve en DNS** (verificado el 2026-09-10).
> El origen que responde hoy es el de Vercel:
>
> ```
> AUTH_JWKS_URL=https://catalogo-jdh.vercel.app/api/auth/jwks
> ```
>
> Declarar el dominio previsto haría que el API no alcanzara el JWKS y
> respondiera **503** en todas las rutas autenticadas, con un síntoma que
> parece un fallo del guard y no de una variable. Ya estuvo a punto de pasar:
> este documento daba el dominio propio como valor de producción y se pasó
> como tal al equipo del API.
>
> Cuando el dominio propio se active, basta con cambiar esta variable y
> `NEXT_PUBLIC_SITE_URL`. El `iss` sigue siendo `jdh-catalogo-ui` y no depende
> de la URL, así que los tokens ya emitidos no se invalidan.

Tres reglas al implementarlo:

- **Verificar `aud`, no solo la firma.** Sin eso, un token emitido para otro
  servicio futuro serviría aquí.
- **`listaPrecioId` es una referencia a verificar**, no un permiso concedido.
  El API tiene que comprobar que esa lista existe y aplica al cliente contra su
  propio catálogo. Lo mismo con `clienteId` frente al ERP.
- **Hay hasta 5 minutos de desfase.** Si un admin desvincula un cliente, un
  token ya emitido sigue trayendo su `listaPrecioId` hasta que caduque. Es el
  mismo desfase que ya tenía `session.cookieCache`; si alguna operación exige
  revocación inmediata, el API tiene que consultar el estado actual del cliente
  en lugar de confiar en el claim.

`jose` cachea el JWKS, así que esto no añade una llamada de red por petición.
