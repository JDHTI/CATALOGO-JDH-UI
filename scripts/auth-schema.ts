// Config mínima para el CLI de Better Auth (`pnpm auth:migrate`). El CLI
// carga este archivo con `jiti`, fuera del bundler de Next.js, así que no
// puede resolver `import "server-only"` ni el alias `@/*` — de ahí que este
// archivo exista por separado de `src/lib/auth/server.ts` en vez de
// importarlo. Solo necesita reflejar lo que afecta al ESQUEMA de la base de
// datos (`database`, `user.additionalFields`, `emailAndPassword`); si esos
// campos cambian en `src/lib/auth/server.ts`, cambian aquí también.
import { betterAuth } from "better-auth"
import { Pool } from "pg"

export const auth = betterAuth({
  database: new Pool({ connectionString: process.env.DATABASE_URL }),
  // Presente porque habilita la tabla `account` con credenciales (hash de
  // contraseña) que usan las cuentas de cliente.
  emailAndPassword: { enabled: true },
  // Presente porque `storage: "database"` es lo que hace que el CLI cree la
  // tabla `rateLimit`. Ver la nota de `rateLimit` en src/lib/auth/server.ts.
  rateLimit: { storage: "database" },
  user: {
    additionalFields: {
      roles: {
        type: "string[]",
        input: false,
        required: false,
        defaultValue: ["cliente"],
      },
      clienteId: { type: "string", input: false, required: false },
      listaPrecioId: { type: "string", input: false, required: false },
      preferenciaMostrarIva: {
        type: "boolean",
        input: true,
        required: false,
        defaultValue: true,
      },
    },
  },
})
