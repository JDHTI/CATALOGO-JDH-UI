# Catálogo JDH

Catálogo de productos de **Juan D. Hoyos Distribuciones**. Next.js 16 (App Router), TypeScript, Tailwind CSS v4, shadcn/ui.

Tiene tres frentes:

| Frente               | Ruta              | Audiencia                          | Precios             |
| -------------------- | ----------------- | ---------------------------------- | ------------------- |
| Catálogo público     | `/`, `/productos` | cualquiera, sin sesión             | lista pública       |
| Catálogo de clientes | las mismas        | cuentas de cliente (email + clave) | lista negociada     |
| Administración       | `/admin/*`        | personal JDH (Entra ID)            | gestiona las listas |

Los dos primeros comparten rutas, shell y componentes a propósito: lo único que varía es de dónde sale el precio. Esa costura vive en `src/lib/precios/`.

## Requisitos

- Node.js 20+
- pnpm 11 (`packageManager` lo fija)

## Arranque

```bash
pnpm install
cp .env.example .env.local   # y completar los valores
pnpm dev
```

Abre http://localhost:3000.

> La infraestructura de datos aún no está definida: `DATABASE_URL` puede quedar como placeholder para desarrollar la UI. Las sesiones no funcionan hasta que exista Postgres y se corra `pnpm auth:migrate`.

## Comandos

```bash
pnpm dev            # servidor de desarrollo (Turbopack)
pnpm build          # build de producción
pnpm start          # servir el build
pnpm lint           # eslint
pnpm typecheck      # tsc --noEmit
pnpm format         # prettier --write .
pnpm auth:migrate   # aplicar el esquema de Better Auth a Postgres
```

```bash
pnpm test              # contrato, SEO, seguridad y estados de componentes (Vitest)
pnpm test:watch        # pruebas en modo watch
pnpm test:integration  # HTTP contra Next real y API temporal; no requiere backend ni credenciales
```

La integración HTTP levanta su propio servidor de desarrollo. Ejecutarla sin otro
`next dev` abierto en este worktree (ambos usarían `.next/dev`).

## Estructura

```
src/
  app/            # solo enrutamiento — (catalogo) | (auth) | admin | api
  modules/        # rebanadas verticales (catalogo/ es la de referencia)
  components/     # ui/ = shadcn · el resto = catálogo JDH por dominio
  config/         # sitio, permisos, registro de módulos, nav, footer
  lib/            # auth, precios, query-client, utils, format
  proxy.ts        # middleware (Next 16) — público-primero
```

Contrato de un módulo: `src/modules/README.md`.

## Documentación

- **`docs/product-content.md`** — contrato editorial, fallbacks SEO, canonical y verificación.

- **`.claude/DESIGN.md`** — sistema de diseño JDH (monocromo corporativo, tokens, componentes, WCAG 2.2 AA). Fuente de verdad visual.
- **`.claude/ARCHITECTURE.md`** — registro de decisiones arquitectónicas: por qué el proyecto está así.
- **`.claude/CLAUDE.md`** — guía operativa para agentes de código.
