# Despliegue en tienda.jdh.local (Docker)

Alternativa al despliegue en Vercel (`despliegue.md`): la misma app corre en la
VM `tienda.jdh.local` (192.168.100.218) con Docker Compose, detrás de Caddy con
TLS de la CA interna. El stack completo (UI, API, Postgres, Redis, storage y
Caddy) lo define el repo **CATALOGO-JDH-API** en `deploy/`; este repo aporta
solo la imagen y su pipeline. Runbook completo: `deploy/README.md` de ese repo.

> **Dominio público: `tienda.jdh.com.co`.** La CA interna solo firma
> `*.jdh.local`, así que el nombre público lleva un certificado público (ACME,
> Let's Encrypt) y es el dominio canónico de la app. Se activa con
> `PUBLIC_HOST` en `deploy/.env` del repo del API; `TIENDA_HOST`
> (`tienda.jdh.local`) sigue sirviéndose con la CA interna. Donde este
> documento dice «dominio canónico» es `PUBLIC_HOST` si está definido y, si no,
> `TIENDA_HOST`.

## Qué aporta este repo

| Archivo                       | Para qué                                                                                                                      |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `Dockerfile`                  | Etapas `deps` → `auth-migrate` (one-shot de Better Auth) → `build` → `runtime` (Next standalone, usuario `node`, healthcheck) |
| `.dockerignore`               | Contexto de build mínimo (sin `node_modules`, `.next`, `.env*`, docs)                                                         |
| `next.config.ts`              | `output: "standalone"` **solo** con `NEXT_OUTPUT=standalone` (lo fija el Dockerfile); el build de Vercel no cambia            |
| `src/app/api/health/route.ts` | `GET /api/health` para el `HEALTHCHECK` y la verificación del despliegue; no consulta Postgres ni el API a propósito          |
| `.github/workflows/ci-cd.yml` | CI en GitHub (lint, tipos, pruebas, imagen) y CD en el runner self-hosted `tienda-jdh`                                        |

## Diferencias con Vercel

- **Un solo origen.** Caddy sirve la UI en `/`, el API en `/api/v1` y las
  imágenes en `/media`. No hay CORS.
- **`NEXT_PUBLIC_API_URL=/api/v1`, relativa.** El navegador la completa con el
  origen por el que entró (IP, `tienda.jdh.local` o nombre público, por http o
  https) y el servidor usa `BACKEND_API_URL` por la red interna. Con un host
  fijo horneado, quien entra desde internet pide los productos a un `.local`
  que no resuelve y el catálogo queda vacío.
- **`NEXT_PUBLIC_ASSETS_CDN_URL=https://<dominio canónico>/media`** sigue
  absoluta: las imágenes pasan por `/_next/image`, que las descarga el
  servidor, así que el navegador nunca pide ese host.
- **`NEXT_PUBLIC_*` son `build.args`** del compose (derivadas del dominio
  canónico), no variables del dashboard: cambiarlas exige `deploy.sh ui`.
- **`DATABASE_URL`** apunta al Postgres del propio stack (`postgres:5432`,
  base `jdh_auth`), sin pooler: aquí hay un solo proceso Node de larga vida,
  no una función por petición.
- **Migraciones de Better Auth**: las corre el servicio `ui-auth-migrate` en
  cada despliegue (`pnpm auth:migrate`, idempotente), no a mano.
- **`ALLOW_LOCAL_IMAGE_HOSTS=1` en el build**: el bucket está en un host de la
  LAN (el alias de Caddy resuelve a una IP privada de Docker) y Next 16 bloquea
  por defecto la optimización de imágenes de IPs locales. Aquí es correcto; en
  Vercel/R2 sigue siendo «nunca».
- **`NODE_EXTRA_CA_CERTS`** apunta a la raíz interna para que el fetch
  server-side a `https://tienda.jdh.local` confíe en el certificado. El nombre
  público no la necesita: su certificado es de una CA pública. Un alias de
  Caddy en la red de Docker hace que la UI lo resuelva sin salir a la IP
  pública.
- **`BACKEND_API_URL=http://api:8080/api/v1`** (catálogo del lado del
  servidor, favoritos y listas) por la red interna; el API valida el JWT contra `http://ui:3000/api/auth/jwks`.
- **Entra ID**: redirect URI
  `https://tienda.jdh.com.co/api/auth/callback/microsoft` (el dominio canónico;
  antes era `tienda.jdh.local`). `BETTER_AUTH_URL` sale de ahí y debe coincidir
  byte a byte con el registrado. Mientras no esté registrado, el ingreso de
  clientes (email + contraseña) funciona y el del personal responde
  `AADSTS50011`. El personal debe entrar por el dominio canónico: el flujo de
  OAuth arma el callback con `BETTER_AUTH_URL`, y entrar por la IP o por
  `tienda.jdh.local` deja la cookie de estado en otro host.

## Probar la imagen en local

```bash
docker build -t jdh-catalogo-ui \
  --build-arg NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1 \
  --target runtime .
```

Sin los args de `NEXT_PUBLIC_*` quedan los valores por defecto del código. La
imagen necesita `DATABASE_URL`, `BETTER_AUTH_SECRET` y las tres
`AUTH_MICROSOFT_ENTRA_ID_*` en runtime (el build usa valores de relleno que no
quedan en la imagen final).

## Mantenimiento del `Dockerfile`

> El trazado de `output: "standalone"` omite `@swc/helpers/esm` y, con Node ≥
> 22.12, el contenedor muere con
> `Cannot find module .../@swc/helpers/esm/_interop_require_default.js`.
> `next.config.ts` lo incluye con
> `outputFileTracingIncludes`. Si Next o pnpm cambian la ruta del store
> virtual y el síntoma reaparece, empezar por ahí.
