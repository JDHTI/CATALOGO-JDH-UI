import "server-only"

/** Tenant id de Microsoft para cuentas personales (@outlook.com, @hotmail.com, etc.). */
const PERSONAL_MICROSOFT_ACCOUNT_TENANT_ID =
  "9188040d-6c67-4c5b-b112-36a304b66dad"

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Falta la variable de entorno ${name}`)
  return value
}

export const JDH_TENANT_ID = requireEnv("AUTH_MICROSOFT_ENTRA_ID_TENANT_ID")

/**
 * Defensa en profundidad: Entra ya restringe el login a este tenant porque el
 * App Registration es single-tenant y `tenantId` en el proveedor apunta al
 * tenant real (no "common") — eso rechaza cuentas ajenas y personales antes
 * de llegar aquí. Esta función es la segunda capa, por si esa configuración
 * cambiara alguna vez en el portal de Entra.
 */
export function assertJdhTenant(profile: {
  tid: string
  acct?: 0 | 1 | undefined
}): void {
  if (profile.tid === PERSONAL_MICROSOFT_ACCOUNT_TENANT_ID) {
    throw new Error(
      "Las cuentas personales de Microsoft no tienen acceso a esta aplicación."
    )
  }
  if (profile.tid !== JDH_TENANT_ID) {
    throw new Error("Esta cuenta no pertenece al tenant de JDH.")
  }
  // `acct` solo llega si está configurado como optional claim del id token en
  // Entra (Token configuration -> Add optional claim -> ID -> acct); si no
  // está configurado, no puede usarse para distinguir invitados de miembros,
  // así que solo se rechaza cuando el valor SÍ llega y es explícitamente 1
  // (invitado confirmado) — nunca por ausencia del claim.
  if (profile.acct === 1) {
    throw new Error(
      "Las cuentas invitadas (B2B) no tienen acceso a esta aplicación."
    )
  }
}
