"use server"

import { headers } from "next/headers"
import { unstable_rethrow } from "next/navigation"
import { APIError } from "better-auth/api"

import { registroSchema } from "./registro"
import { auth } from "./server"

/**
 * Server Actions de autenticación de CUENTAS DE CLIENTE.
 *
 * El registro no llama a `authClient.signUp` desde el navegador a propósito.
 * La política de contraseña de `./registro.ts` es más estricta que lo único
 * que Better Auth sabe imponer (largo mínimo y máximo), así que si el alta se
 * disparara directo contra `/api/auth/sign-up/email` bastaría con un `fetch`
 * a mano para saltarse todas las demás reglas. Pasando por esta acción, el
 * mismo esquema que pinta los errores en el formulario es el que decide.
 *
 * La sesión la deja lista el plugin `nextCookies()` (último en la lista de
 * `./server.ts`), que traslada los `Set-Cookie` de Better Auth a las cookies
 * de Next cuando se le llama desde una Server Action. Por eso la acción no
 * devuelve ningún token: la cookie es httpOnly y el navegador nunca ve el
 * valor de la sesión. Nada de esto toca `localStorage`.
 */

export type ResultadoRegistro =
  | { ok: true }
  | {
      ok: false
      /** Mensaje general, para el `Alert` del formulario. */
      mensaje: string
      /** Mensajes por campo, para pintarlos bajo su control. */
      errores?: Partial<
        Record<"nombre" | "email" | "contrasena" | "confirmacion", string>
      >
    }

export async function registrarCliente(
  entrada: unknown
): Promise<ResultadoRegistro> {
  const validacion = registroSchema.safeParse(entrada)

  if (!validacion.success) {
    const errores: NonNullable<
      Extract<ResultadoRegistro, { ok: false }>["errores"]
    > = {}
    for (const issue of validacion.error.issues) {
      const campo = issue.path[0]
      if (
        (campo === "nombre" ||
          campo === "email" ||
          campo === "contrasena" ||
          campo === "confirmacion") &&
        !errores[campo]
      ) {
        errores[campo] = issue.message
      }
    }
    return {
      ok: false,
      mensaje: "Revisa los datos marcados e inténtalo de nuevo.",
      errores,
    }
  }

  const { nombre, email, contrasena } = validacion.data

  try {
    await auth.api.signUpEmail({
      headers: await headers(),
      body: { name: nombre, email, password: contrasena },
    })
  } catch (error) {
    unstable_rethrow(error)

    if (error instanceof APIError) {
      // Decir "ese correo ya tiene cuenta" es un oráculo de enumeración, y por
      // eso el INGRESO no distingue "no existe" de "clave incorrecta". Aquí sí
      // se dice, porque la alternativa que preserva el secreto —aceptar el
      // registro en silencio y avisar por correo al dueño de la dirección—
      // necesita envío de correo, que todavía no existe (ver ARCHITECTURE.md).
      // Cambiar a esa variante cuando lo haya.
      if (error.body?.code === "USER_ALREADY_EXISTS") {
        return {
          ok: false,
          mensaje: "Ya existe una cuenta con ese correo. Intenta ingresar.",
          errores: { email: "Este correo ya está registrado." },
        }
      }
      return {
        ok: false,
        mensaje:
          error.body?.message ??
          "No pudimos crear la cuenta. Inténtalo de nuevo.",
      }
    }

    console.error("[auth] Falló el registro de cliente:", error)
    return {
      ok: false,
      mensaje:
        "No pudimos crear la cuenta en este momento. Inténtalo más tarde.",
    }
  }

  return { ok: true }
}
