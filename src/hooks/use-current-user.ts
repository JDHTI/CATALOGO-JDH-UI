"use client"

import { authClient } from "@/lib/auth/client"

/**
 * Client-side session read (`"use client"` chrome — header, nav, mega menu).
 * `permissions` is always an array (never `undefined`) so callers can filter
 * with it immediately, including while the session is still loading.
 */
export function useCurrentUser() {
  const { data, isPending, error } = authClient.useSession()

  return {
    user: data?.user ?? null,
    permissions: data?.user.permissions ?? [],
    isPending,
    error,
  }
}
