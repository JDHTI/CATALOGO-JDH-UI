"use server"

import { headers } from "next/headers"
import { unstable_rethrow } from "next/navigation"

import {
  PublicFetchNoConfiguradoError,
  publicFetch,
} from "@/lib/api/public-fetch"

import {
  aCuerpoApi,
  contactoSchema,
  type CampoContacto,
} from "../schemas/contacto"

/**
 * Server Action del formulario de contacto del homepage (tipo newsletter).
 *
 * Misma forma que `registrarCliente` (`src/lib/auth/acciones.ts`): valida con
 * el esquema compartido, devuelve errores por campo y un mensaje general, y
 * nunca deja escapar un error crudo al cliente. Guarda en el API con
 * `POST /contact-leads`, que es público: ver `publicFetch`.
 *
 * El campo trampa `sitioWeb` va oculto en el formulario; una persona no lo
 * ve y un bot que rellena todo sí. Si llega con algo se responde ÉXITO sin
 * enviar nada, para que el bot no aprenda a esquivarlo.
 *
 * El API limita a 5 envíos cada 10 minutos por IP. La llamada sale de este
 * servidor, así que se reenvía la IP del visitante en `X-Forwarded-For`: sin
 * ella, todos los visitantes compartirían la cuota de la IP de Next.
 */

export type ResultadoContacto =
  | { ok: true }
  | {
      ok: false
      /** Mensaje general, para el `Alert` del formulario. */
      mensaje: string
      /** Mensajes por campo, para pintarlos bajo su control. */
      errores?: Partial<Record<CampoContacto, string>>
    }

export async function enviarContacto(
  entrada: unknown
): Promise<ResultadoContacto> {
  if (esBot(entrada)) return { ok: true }

  const validacion = contactoSchema.safeParse(entrada)
  if (!validacion.success) {
    const errores: Partial<Record<CampoContacto, string>> = {}
    for (const issue of validacion.error.issues) {
      const campo = issue.path[0] as CampoContacto
      if (typeof campo === "string" && !errores[campo]) {
        errores[campo] = issue.message
      }
    }
    return {
      ok: false,
      mensaje: "Revisa los datos marcados e inténtalo de nuevo.",
      errores,
    }
  }

  try {
    const respuesta = await publicFetch("/contact-leads", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(await cabecerasDelVisitante()),
      },
      body: JSON.stringify(aCuerpoApi(validacion.data)),
    })

    if (respuesta.ok) return { ok: true }

    if (respuesta.status === 429) {
      return {
        ok: false,
        mensaje:
          "Recibimos varios envíos seguidos desde tu conexión. Inténtalo de nuevo en unos minutos.",
      }
    }

    // Un 400 aquí es un desfase de contrato (el esquema de arriba ya filtró lo
    // que el usuario puede corregir): se registra para verlo en los logs.
    console.error(
      "[contacto] El API rechazó el registro:",
      respuesta.status,
      await respuesta.text().catch(() => "")
    )
  } catch (error) {
    unstable_rethrow(error)
    if (error instanceof PublicFetchNoConfiguradoError) {
      console.error(
        "[contacto] Falta BACKEND_API_URL: no hay API a la que enviar."
      )
    } else {
      console.error("[contacto] No se pudo contactar el API:", error)
    }
  }

  return {
    ok: false,
    mensaje:
      "No pudimos guardar tus datos en este momento. Inténtalo más tarde.",
  }
}

function esBot(entrada: unknown): boolean {
  if (typeof entrada !== "object" || entrada === null) return false
  const trampa = (entrada as Record<string, unknown>).sitioWeb
  return typeof trampa === "string" && trampa.trim() !== ""
}

/**
 * La IP real del visitante es la ÚLTIMA de la cadena que recibió Next (la
 * agrega el proxy de confianza, Caddy, delante de la UI); se envía como
 * último valor, que es lo que el API lee con `TRUST_PROXY`.
 */
async function cabecerasDelVisitante(): Promise<Record<string, string>> {
  const entrantes = await headers()
  const ip =
    entrantes.get("x-forwarded-for")?.split(",").at(-1)?.trim() ||
    entrantes.get("x-real-ip")?.trim()
  const agente = entrantes.get("user-agent")
  return {
    ...(ip ? { "X-Forwarded-For": ip } : {}),
    ...(agente ? { "User-Agent": agente } : {}),
  }
}
