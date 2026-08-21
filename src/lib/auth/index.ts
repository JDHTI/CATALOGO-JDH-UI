import "server-only"

import { headers } from "next/headers"
import { notFound, redirect, unstable_rethrow } from "next/navigation"

import {
  ANONYMOUS_PERMISSIONS,
  hasAll,
  normalizeRoles,
  type Role,
} from "@/config/permissions"

import { auth } from "./server"
import { hasSessionCookie } from "./session-cookie"

/**
 * Provider-agnostic auth facade.
 *
 * The rest of the app depends on THIS interface, never directly on Better
 * Auth. Two identity sources sit behind it (Entra ID for JDH staff, email +
 * password for external client accounts) and callers must not care which one
 * produced the session — see `./server.ts`.
 *
 * `clienteId` / `listaPrecioId` are the fields the pricing layer reads; a
 * session without `clienteId` (staff, or a client account not yet linked to
 * an ERP record) sees public pricing. Never branch on the role to decide
 * pricing — branch on `clienteId`, via `src/lib/precios`.
 */
export interface CurrentUser {
  id: string
  name: string
  email: string
  roles: Role[]
  permissions: string[]
  /** Código del cliente en el ERP. `null` para personal JDH o cuenta sin vincular. */
  clienteId: string | null
  /** Lista de precios negociada. `null` → lista pública. */
  listaPrecioId: string | null
  /** Preferencia de visualización: precios con IVA incluido. */
  preferenciaMostrarIva: boolean
}

/**
 * Returns the signed-in user, or `null` if unauthenticated.
 *
 * The data infrastructure is still undefined (see `ARCHITECTURE.md`) —
 * `DATABASE_URL` may point at nothing real yet. A failed session lookup must
 * NOT crash the public catalog for anonymous visitors, so a DB/connection
 * error is treated the same as "no session" rather than thrown. This is
 * fail-closed for privileged surfaces too: `requirePermissions` already
 * redirects/404s on `null`, so a DB outage denies access instead of granting it.
 *
 * `unstable_rethrow` lets Next's own control-flow errors (the dynamic-usage
 * bailout during static generation, `redirect()`, `notFound()`) pass through
 * uncaught — only a genuine DB/network failure gets logged and swallowed here.
 *
 * Short-circuits on `hasSessionCookie`: an anonymous visitor (most of the
 * catalog's traffic) sends no session cookie, so there's nothing to look up
 * — skip the DB entirely instead of querying it just to learn "no session".
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const headerList = await headers()
  if (!hasSessionCookie(headerList.get("cookie"))) return null

  let result: Awaited<ReturnType<typeof auth.api.getSession>>
  try {
    result = await auth.api.getSession({ headers: headerList })
  } catch (error) {
    unstable_rethrow(error)
    console.error("[auth] No se pudo leer la sesión:", error)
    return null
  }
  if (!result) return null

  const { user } = result
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    roles: normalizeRoles(user.roles),
    permissions: user.permissions ?? [],
    clienteId: user.clienteId ?? null,
    listaPrecioId: user.listaPrecioId ?? null,
    preferenciaMostrarIva: user.preferenciaMostrarIva ?? true,
  }
}

/**
 * Permisos efectivos del visitante actual, con o sin sesión. Esta es la
 * función que debe usar cualquier superficie que también sirva a anónimos
 * (el catálogo): devuelve `ANONYMOUS_PERMISSIONS` en vez de `[]`, para que un
 * módulo público no quede oculto por falta de sesión.
 */
export async function getEffectivePermissions(): Promise<readonly string[]> {
  const user = await getCurrentUser()
  return user?.permissions ?? ANONYMOUS_PERMISSIONS
}

/** Redirects to `/ingreso` if unauthenticated; returns the user otherwise. */
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser()
  if (!user) redirect("/ingreso")
  return user
}

/** Whether the current visitor holds every permission in `required`. */
export async function hasPermissions(required: string[]): Promise<boolean> {
  if (required.length === 0) return true
  return hasAll(await getEffectivePermissions(), required)
}

/**
 * Requires both authentication and every permission in `required`. Renders
 * a 404 (not a 403) on a permission miss, so an unauthorized user can't
 * infer that a gated route exists.
 */
export async function requirePermissions(
  required: string[]
): Promise<CurrentUser> {
  const user = await requireUser()
  if (!hasAll(user.permissions, required)) notFound()
  return user
}
