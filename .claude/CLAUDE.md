# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

This file, along with `DESIGN.md` and `ARCHITECTURE.md`, lives in `.claude/` (not the repo root) to keep the project root clean — Claude Code discovers `.claude/CLAUDE.md` the same as a root-level `CLAUDE.md`. `AGENTS.md` and `README.md` stay at the repo root: `AGENTS.md` is a cross-tool convention other AI coding assistants also expect there (and `next dev` rewrites it), and `README.md` is what GitHub renders.

@../AGENTS.md

## Project

Catálogo JDH — product catalog for Juan D. Hoyos Distribuciones. Next.js 16 (App Router), TypeScript, Tailwind CSS v4, shadcn/ui, TanStack Query/Table. Package manager is **pnpm**.

It has **three surfaces**:

1. **Public catalog** — anyone, no session, public list prices.
2. **Client catalog** — signed-in external client accounts; same routes and same UI as the public one, negotiated prices.
3. **Admin panel** (`/admin/*`) — JDH staff via Entra ID; its own shell and sidebar.

Surfaces 1 and 2 are ONE route group (`src/app/(catalogo)/`) on purpose. See "Pricing" below — it's the most important convention in this repo.

The whole foundation (design system, component catalog, module architecture) is a deliberate port from the sibling project `INTRANET-JDH-UI`; the two share a dialect. See the 2026-08-19 entries in `ARCHITECTURE.md` before changing anything structural.

## Commands

```
pnpm dev            # start dev server (Turbopack, default in Next 16)
pnpm build          # production build (Turbopack, default in Next 16)
pnpm start          # run the production build
pnpm lint           # eslint
pnpm typecheck      # tsc --noEmit
pnpm format         # prettier --write .
pnpm format:check   # prettier --check .
pnpm auth:migrate   # apply Better Auth's schema to Postgres (needs a real DATABASE_URL)
```

There is no test runner configured yet — no framework, no script, no test files. Adding one is a decision to raise, not to assume.

To add a shadcn/ui component: `pnpm dlx shadcn@latest add <component>`. This regenerates files under `src/components/ui/`, which is why that directory is excluded from Prettier (`.prettierignore`) — reformatting it creates diff noise against the upstream CLI output. Don't hand-restructure files there; re-run the CLI (`--overwrite`) instead.

Skeletons come from boneyard-js: `npx boneyard-js build` (with the dev server up) visits the routes in `boneyard.config.json`, measures the real DOM, and overwrites `src/bones/`. That directory is generated — re-capture after visual changes to any component wrapped in `<Skeleton>`. `src/bones/registry.ts` is currently an empty placeholder, so every `<Skeleton>` falls back to its `fallback` prop.

## Next.js 16 — do not rely on pre-16 conventions

Scaffolded on Next.js 16.3.1 / React 19.2. Next 16 has real breaking changes from what most training data assumes. Before writing App Router code, check `node_modules/next/dist/docs/01-app/` if unsure. Already accounted for here:

- `params`, `searchParams`, `cookies()`, `headers()`, `draftMode()` are **always async** (Promises) — the Next 15 sync compat shim is gone. Always `await` them.
- **Turbopack is the default** bundler for both `next dev` and `next build` — no `--turbopack` flag.
- Caching is opt-in per fetch (`{ cache: 'force-cache' }` or `{ next: { revalidate } }`); there's a stable `"use cache"` directive plus `cacheLife()` / `cacheTag()` from `next/cache`.
- Middleware is `proxy.ts` (export `proxy`, not `middleware`); the `edge` runtime is not supported there. This app has `src/proxy.ts`.
- `next.config.ts` sets `typedRoutes: true`. Dynamically-derived hrefs need `href={x as Route}` (`import type { Route } from "next"`); static literals don't.

## Pricing: the one convention that matters most

`src/lib/precios/` is the seam between the public and the client catalog. `getPriceContext()` reads the session ONCE per request and returns a `PriceContext`.

**A query never reads the session to decide a price — it receives `PriceContext` as an explicit argument.** That keeps queries pure with respect to audience, cacheable per price list (`priceCacheKey()`), and makes it structurally impossible to leak negotiated prices onto the public surface by forgetting a check. `src/modules/catalogo/server/queries.ts` (`resolverPrecio`) is the reference.

A component may branch on `audiencia` for **copy**, never for structure. Values travel in **centavos of COP** everywhere (`Precio.valor`); the conversion happens only in `src/lib/format.ts`.

Known open cost: `/` and `/productos` build as dynamic routes because of this session read. See `ARCHITECTURE.md`.

## Architecture

### ARCHITECTURE.md is the decision log

`.claude/ARCHITECTURE.md` is a living log of _why_ the project is structured the way it is. It's not API docs (the code is) and not the visual system (that's `DESIGN.md`). Read it before making a structural change (new dependency, new data-fetching pattern, auth change, folder convention change), and add a dated entry when you make one — format at the top of the file.

### Folder structure: thin routes + registry-driven vertical modules

- **`src/app/` = routing only.** Route groups: `(catalogo)` (public + client catalog, owns `/`), `(auth)` (`/ingreso`, no chrome), `admin/` (its own layout → `/admin/*`). A `page.tsx` stays thin: resolve the price context, call the module's queries, render the module's view, set `metadata`. No domain logic here.
- **`src/modules/<id>/` = self-contained vertical slices.** Manifest (`<id>.module.ts` via `defineModule`) + public barrel (`index.ts`); plus, as needed, `components/`, `types.ts`, `schemas/` (zod), `server/` (`server-only` queries + Server Actions), `hooks/` (TanStack Query), `mock/`. **`catalogo/` is the reference implementation** — copy its shape. Full contract: `src/modules/README.md`. A module never imports another module's internals.
- **The module system** (`src/lib/modules/` + `src/config/modules.ts`): register a module in one line; nav, mega menu, and permission checks derive from the registry. `src/config/permissions.ts` is the RBAC vocabulary; `src/lib/auth/` is the provider-agnostic facade (depend on it, never on `better-auth` directly outside `src/lib/auth/`).
- **Admin is not in the registry.** Its nav is declared in `src/modules/admin/admin-nav.ts` — different audience, different surface. Admin views consume the same module data layer.

Gotchas when touching nav/routing:

- **Never pass a module (or its `icon`) as props across the server→client boundary** — icons are functions and can't be serialized. Client nav components (`MainNav`, `MegaMenu`, `MobileBottomNav`) import the registry directly. That's why they're `"use client"`.
- A module's barrel must **not** re-export `server/queries.ts` (it carries `import "server-only"`, which would poison every client bundle that just wants the manifest's icon). Routes import queries by deep path: `@/modules/<id>/server/queries`.

### Auth

Better Auth (**pinned to 1.6.25** — 1.7.x breaks `additionalFields` inference) with two providers: Entra ID for JDH staff, email+password for external client accounts. One `/ingreso` screen for both. Facade: `src/lib/auth/index.ts`.

- `getEffectivePermissions()`, not `user?.permissions ?? []`, on any surface that also serves anonymous visitors — otherwise the public catalog hides itself when there's no session.
- `src/proxy.ts` is **public-first**: only `PROTECTED_PREFIXES` require a session. A new private area is NOT protected by default — add it there. The authoritative check is always `requirePermissions` in the layout / Server Action.
- `clienteId` / `listaPrecioId` are `input: false` — only writable via `internalAdapter.updateUser`. The admin flow that assigns them does not exist yet, so no client can actually sign in yet.
- Infra is undefined: `DATABASE_URL` is a placeholder. Sessions won't work until Postgres exists and `pnpm auth:migrate` runs.

### Design system: DESIGN.md is the source of truth

`.claude/DESIGN.md` is JDH's web design system: a strict **monochrome** corporate look (black `#1D1D1B` chrome, white, warm grays — no accent hues except the logo), design tokens, and component specs with accessibility rules (WCAG 2.2 AA). Consult it before improvising colors/spacing/radii.

`src/app/globals.css` implements those tokens as CSS custom properties (primitive → semantic, matching DESIGN.md §2) and then maps the **semantic** JDH tokens onto shadcn/ui's theme variables (`--background`, `--primary`, `--border`, `--radius`, …) in `@theme inline`. So shadcn primitives render in the JDH look with no per-component overrides — never hardcode raw hex/px; use the variables or utilities that resolve to them.

Deliberate deviations from DESIGN.md (all commented in `globals.css`):

- Dark mode toggles via the `.dark` class (next-themes convention) rather than DESIGN.md's `[data-theme]` attribute — same values, different selector.
- `--destructive` keeps shadcn's red instead of strict monochrome, as a pragmatic exception for destructive affordances.
- Centrale Sans is live: `@font-face` at the top of `globals.css` loads `.woff2` from `public/fonts/`, first in the `--font-sans` stack. Only the four authorized weights ship (Light 300, Regular 400, Medium 500, Bold 700) each with its italic. Originals in `docs/brand/fonts/`; re-run `python scripts/generate-font-assets.py` (needs `fonttools` + `brotli`) if they change. Don't reference a weight outside those four.
- shadcn's radius scale is derived from one `--radius` base (set to 4px so `rounded-lg` controls match DESIGN.md exactly); `rounded-xl` cards land ~5.6px instead of 8px — accepted rather than fighting the derivation formula.

### Component catalog: `Jdh*` lives OUTSIDE `ui/`

`src/components/ui/` is shadcn CLI output — don't put visual deltas there. JDH components live by domain in `components/{common,layout,navigation,forms,cards,data,modals,motion,icons}`. Use **`JdhButton` / `JdhInput` / `JdhCard` / `DataTable`** in features, not the `ui/` primitives (those stay as internal dependencies of shadcn compounds like dialog and dropdown). Error state is monochrome (2px border + text + icon, never color alone) via `INVALID_CONTROL_CLASSES` in `forms/field.tsx`.

Every table goes through `components/data/data-table.tsx` (TanStack Table engine, CSS-grid render with ARIA roles). Portal z-index is fixed by `data-slot` in a `@layer components` block in `globals.css` — a new portaling `ui/*` inherits the right z if it emits the expected `data-slot`.

### Providers and data layer

`src/app/layout.tsx` composes: `ThemeProvider` → `LenisProvider` → `QueryProvider` → `TooltipProvider`, with `Toaster` alongside.

- `src/lib/query-client.ts`: SSR-safe TanStack Query pattern (fresh client per request on the server, cached singleton in the browser). Use `getQueryClient()`.
- Client-side fetching goes through TanStack Query hooks in a module's `hooks/`, never loose `useEffect` + `fetch`.
- `src/lib/api/backend-fetch.ts` calls the (not-yet-existing) catalog backend as the current user, forwarding a **short-lived JWT** minted by Better Auth's `jwt` plugin — never the session token, and never DB credentials. The API verifies it against `GET /api/auth/jwks` and must stay out of the `jdh_auth` database. Don't use this helper for public reads — it forces a session and would break caching of anonymous pages. See ARCHITECTURE.md 2026-09-07.

### Path aliases

`@/*` → `src/*` (see `tsconfig.json` and `components.json`). shadcn aliases: `@/components`, `@/components/ui`, `@/lib`, `@/hooks`.
