/**
 * RBAC vocabulary. Permissions are strings of the form `<module>:<action>`.
 * Modules declare the permissions they require in their manifest; the auth
 * layer (`src/lib/auth`) resolves whether the current user holds them.
 *
 * This is the single source of truth for permission strings, so manifests
 * and runtime checks never drift via typos.
 *
 * Unlike a typical staff-only app, this one has an ANONYMOUS audience: the
 * public catalog is reachable with no session at all. That's modelled by the `anonimo`
 * pseudo-role — it is not an identity provider role, it's the permission set
 * used when `getCurrentUser()` returns `null`.
 */
export const PERMISSIONS = {
  catalogo: {
    read: "catalogo:read",
  },
  productos: {
    read: "productos:read",
    manage: "productos:manage",
  },
  /**
   * Ver precios. Las dos variantes son el eje sobre el que difieren el frente
   * público y el de clientes: misma UI, distinta fuente de precio.
   * Ver `src/lib/precios/`.
   */
  precios: {
    publico: "precios:publico",
    cliente: "precios:cliente",
    manage: "precios:manage",
  },
  listas: {
    read: "listas:read",
    manage: "listas:manage",
  },
  pedidos: {
    read: "pedidos:read",
    create: "pedidos:create",
    manage: "pedidos:manage",
  },
  cuenta: {
    read: "cuenta:read",
    manage: "cuenta:manage",
  },
  favoritos: {
    read: "favoritos:read",
  },
  carrito: {
    read: "carrito:read",
  },
  clientes: {
    read: "clientes:read",
    manage: "clientes:manage",
  },
  admin: {
    access: "admin:access",
  },
} as const

/**
 * Roles are named collections of permissions.
 *
 * - `anonimo`  — visitante sin sesión (catálogo público, precios de lista pública).
 * - `cliente`  — cuenta de cliente externo (precios negociados, listas, pedidos).
 * - `asesor`   — comercial JDH: ve clientes y sus precios, no administra el catálogo.
 * - `admin`    — administración del catálogo y de las cuentas de cliente.
 *
 * `cliente` NO se deriva del tenant de Entra (los clientes son externos); ver
 * `src/lib/auth/server.ts` para los dos proveedores de identidad.
 */
export const ROLES = {
  anonimo: "anonimo",
  cliente: "cliente",
  asesor: "asesor",
  admin: "admin",
} as const

export type Role = (typeof ROLES)[keyof typeof ROLES]

export function isRole(value: unknown): value is Role {
  return (
    typeof value === "string" &&
    (Object.values(ROLES) as string[]).includes(value)
  )
}

/**
 * Claim `roles` (App Roles de Entra, para personal JDH) -> `Role[]`. Valores
 * desconocidos se descartan en vez de propagar un permiso no mapeado. Sin rol
 * asignado, una cuenta autenticada cae en `cliente` — el mínimo de cualquier
 * sesión, nunca `anonimo` (que representa "sin sesión").
 */
export function normalizeRoles(claim: unknown): Role[] {
  if (!Array.isArray(claim)) return [ROLES.cliente]
  const roles = claim.filter(isRole)
  return roles.length > 0 ? roles : [ROLES.cliente]
}

/**
 * Permisos que otorga cada rol, como deltas acumulativos: `cliente` extiende
 * a `anonimo`, `asesor` y `admin` extienden a `cliente`. Así un rol superior
 * nunca pierde accidentalmente algo que el inferior ya tenía.
 */
export const ROLE_PERMISSIONS: Record<Role, readonly string[]> = {
  anonimo: [
    PERMISSIONS.catalogo.read,
    PERMISSIONS.productos.read,
    PERMISSIONS.precios.publico,
  ],
  cliente: [
    PERMISSIONS.precios.cliente,
    PERMISSIONS.listas.read,
    PERMISSIONS.listas.manage,
    PERMISSIONS.pedidos.read,
    PERMISSIONS.pedidos.create,
    PERMISSIONS.cuenta.read,
    PERMISSIONS.cuenta.manage,
    PERMISSIONS.favoritos.read,
    PERMISSIONS.carrito.read,
  ],
  asesor: [PERMISSIONS.clientes.read, PERMISSIONS.pedidos.manage],
  admin: [
    PERMISSIONS.productos.manage,
    PERMISSIONS.precios.manage,
    PERMISSIONS.clientes.manage,
    PERMISSIONS.listas.manage,
    PERMISSIONS.admin.access,
  ],
}

/** Permisos de un visitante sin sesión. Base de todo lo demás. */
export const ANONYMOUS_PERMISSIONS: readonly string[] = ROLE_PERMISSIONS.anonimo

/** Pura e isomórfica (sin `server-only`): usable en Server Components y en cliente. */
export function permissionsForRoles(roles: readonly Role[]): string[] {
  const granted = new Set<string>(ROLE_PERMISSIONS.anonimo)
  for (const role of roles) {
    if (role === ROLES.anonimo) continue
    // Toda sesión autenticada es al menos `cliente`.
    for (const permission of ROLE_PERMISSIONS.cliente) granted.add(permission)
    if (role === ROLES.asesor || role === ROLES.admin) {
      for (const permission of ROLE_PERMISSIONS.asesor) granted.add(permission)
    }
    if (role === ROLES.admin) {
      for (const permission of ROLE_PERMISSIONS.admin) granted.add(permission)
    }
  }
  return [...granted]
}

/** Semántica AND: `held` debe cubrir cada permiso de `required`. `[]` siempre pasa. */
export function hasAll(
  held: readonly string[],
  required: readonly string[]
): boolean {
  return required.every((permission) => held.includes(permission))
}
