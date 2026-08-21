import { createAuthClient } from "better-auth/react"
import {
  customSessionClient,
  inferAdditionalFields,
} from "better-auth/client/plugins"

import type { Auth } from "./server"

/**
 * Cliente de Better Auth para Client Components (`useSession`, `signIn`,
 * `signOut`). `inferAdditionalFields<Auth>()` trae `roles`/`jobTitle`/
 * `employeeId` al tipo de `useSession().data.user`; `customSessionClient<Auth>()`
 * hace lo mismo para `permissions` (derivado por el plugin `customSession`
 * del lado servidor, no una columna de la tabla `user`). Import de tipo solo
 * (`import type`) desde `./server`, así que el módulo `server-only` nunca
 * cruza al bundle cliente.
 */
export const authClient = createAuthClient({
  plugins: [inferAdditionalFields<Auth>(), customSessionClient<Auth>()],
})
